import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
from datetime import date, timedelta
import re

NEIS_CONFIG = {
    'API_KEY': 'ed50e755df5d42d4b94db728feab7952',
    'ATPT_CODE': 'J10',
    'SCHOOL_CODE': '7692130',
    'BASE_URL': 'https://open.neis.go.kr/hub/mealServiceDietInfo'
}

def clean_menu_item(text):
    text = re.sub(r'\([\d\.]+\)', '', text)  # (1.2.5) 알레르기 번호 제거
    text = re.sub(r'\([가-힣]+\)', '', text)  # (중) 크기 표시 제거
    return text.strip()

def get_week_range(today):
    """이번 주 월~금 날짜 반환 (YYYYMMDD 형식)"""
    weekday = today.weekday()  # 0=월 ... 4=금
    monday = today - timedelta(days=weekday)
    friday = monday + timedelta(days=4)
    return monday.strftime("%Y%m%d"), friday.strftime("%Y%m%d")

def get_today_lunch():
    today = date.today()
    today_ymd = today.strftime("%Y%m%d")
    today_str = today.strftime("%Y-%m-%d")

    from_ymd, to_ymd = get_week_range(today)

    try:
        url = (f"{NEIS_CONFIG['BASE_URL']}?KEY={NEIS_CONFIG['API_KEY']}&Type=json"
               f"&ATPT_OFCDC_SC_CODE={NEIS_CONFIG['ATPT_CODE']}"
               f"&SD_SCHUL_CODE={NEIS_CONFIG['SCHOOL_CODE']}"
               f"&MLSV_FROM_YMD={from_ymd}&MLSV_TO_YMD={to_ymd}")
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        print(f"[오류] NEIS API 접속 실패: {e}")
        sys.exit(1)

    if 'mealServiceDietInfo' not in data or len(data['mealServiceDietInfo']) < 2:
        print(f"[안내] {today_str} 날짜의 급식 정보를 찾을 수 없습니다. (방학/공휴일일 수 있습니다)")
        return

    rows = data['mealServiceDietInfo'][1].get('row', [])
    today_meal = next((r for r in rows if r.get('MLSV_YMD') == today_ymd), None)

    if not today_meal:
        print(f"[안내] {today_str} 날짜의 급식 정보를 찾을 수 없습니다. (방학/공휴일일 수 있습니다)")
        return

    menu_raw = today_meal.get('DDISH_NM', '')
    menu_items = [clean_menu_item(item) for item in menu_raw.split('<br/>') if item.strip()]
    menu_items = [item for item in menu_items if item]

    kcal_info = today_meal.get('CAL_INFO', '정보 없음')

    print(f"=== {today_str} 오늘의 급식 메뉴 ===")
    print(f"열량: {kcal_info}\n")
    for i, item in enumerate(menu_items, 1):
        print(f"  {i}. {item}")

if __name__ == "__main__":
    get_today_lunch()
