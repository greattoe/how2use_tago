const axios = require('axios');

const SERVICE_KEY = "ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D";
const CITY_CODE = "35370";  // 고창군
const NODE_ID = "TSB318000119"; // 보건소

// 현재 시간을 HHMM 형식의 정수로 반환
function getCurrentTimeHHMM() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return parseInt(hh + mm, 10);
}

// 정류장에서 경유하는 노선 목록 조회
async function fetchRoutesAtStation() {
  const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnThrghRouteList` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&nodeid=${NODE_ID}` +
              `&numOfRows=100&pageNo=1&_type=json`;

  const response = await axios.get(url);
  console.log("API 응답 결과:");
  console.log(JSON.stringify(response.data, null, 2));

  let items = response.data?.response?.body?.items?.item;

  if (!items) return [];
  if (!Array.isArray(items)) items = [items];
  return items;
}

// 노선 상세 정보 조회 (첫차/막차 시간 포함)
async function fetchRouteInfo(routeId) {
  const url = `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteInfoIem` +
              `?serviceKey=${SERVICE_KEY}&cityCode=${CITY_CODE}&routeId=${routeId}&_type=json`;

  const response = await axios.get(url);
  return response.data?.response?.body?.items?.item || null;
}

// 전체 실행 로직
async function main() {
  try {
    const currentTime = getCurrentTimeHHMM();
    const routes = await fetchRoutesAtStation();

    if (routes.length === 0) {
      console.log("정류장에 경유하는 노선이 없습니다.");
      return;
    }

    console.log("총 %d개의 노선을 조회합니다.\n", routes.length);

    for (const route of routes) {
      const routeId = route.routeid;
      const routeNo = String(route.routeno);
      const routeInfo = await fetchRouteInfo(routeId);

      if (!routeInfo) {
        console.log("노선 %s (%s): 상세정보 조회 실패", routeNo, routeId);
        continue;
      }

      const start = parseInt(routeInfo.startvehicletime || "0000", 10);
      const end = parseInt(routeInfo.endvehicletime || "0000", 10);
      const isEnded = currentTime > end;

      console.log("노선번호: %s", routeNo);
      console.log("- 기점: %s", routeInfo.startnodenm);
      console.log("- 종점: %s", routeInfo.endnodenm);
      console.log("- 첫차시간: %s", String(start).padStart(4, '0'));
      console.log("- 막차시간: %s", String(end).padStart(4, '0'));
      console.log("- 현재 시각: %s", String(currentTime).padStart(4, '0'));
      console.log("- 운행 종료 여부: %s", isEnded ? "종료됨" : "운행 중");
      console.log("---------------------------------------------------");

      await new Promise(resolve => setTimeout(resolve, 200)); // API 트래픽 제어
    }
  } catch (err) {
    console.error("오류 발생: %s", err.message);
  }
}

main();

