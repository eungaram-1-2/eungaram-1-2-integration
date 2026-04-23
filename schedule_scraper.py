import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
from datetime import date
import json

NEIS_CONFIG = {
    'API_KEY': 'ed50e755df5d42d4b94db728feab7952',
    'ATPT_CODE': 'J10',
    'SCHOOL_CODE': '7692130',
    'BASE_URL': 'https://open.neis.go.kr/hub/SchoolSchedule'
}

def get_school_schedule():
    today = date.today()
    year = today.strftime("%Y")

    try:
        url = (f"{NEIS_CONFIG['BASE_URL']}?KEY={NEIS_CONFIG['API_KEY']}&Type=json"
               f"&ATPT_OFCDC_SC_CODE={NEIS_CONFIG['ATPT_CODE']}"
               f"&SD_SCHUL_CODE={NEIS_CONFIG['SCHOOL_CODE']}"
               f"&AA_YMD={year}")
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        print(f"[오류] NEIS API 접속 실패: {e}")
        sys.exit(1)

    if 'SchoolSchedule' not in data or len(data['SchoolSchedule']) < 2:
        print(f"[안내] {year}년 학사일정을 찾을 수 없습니다.")
        return

    rows = data['SchoolSchedule'][1].get('row', [])

    schedule_list = []
    for row in rows:
        schedule_list.append({
            'date': row.get('AA_YMD'),
            'event': row.get('EVENT_NM', ''),
            'detail': row.get('EVENT_CONT', '')
        })

    # data/schedule.json에 저장
    with open('data/schedule.json', 'w', encoding='utf-8') as f:
        json.dump(schedule_list, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(schedule_list)}개 학사일정을 data/schedule.json에 저장했습니다.")

    # 출력
    for item in schedule_list[:10]:
        print(f"  {item['date']}: {item['event']}")
    if len(schedule_list) > 10:
        print(f"  ... 외 {len(schedule_list) - 10}개")

if __name__ == "__main__":
    get_school_schedule()
