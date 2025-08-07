const axios = require('axios');

const SERVICE_KEY = "여기에_본인_서비스키";
// 기준 좌표 (고창중 근처 예시)
const LAT = 35.428588
const LNG = 126.693797
RADIUS = 1000;  // 단위: 미터
async function fetchNearbyStations() {
  const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList` +
              `?serviceKey=${SERVICE_KEY}&gpsLati=${LAT}&gpsLong=${LNG}` +
              `&radius=${RADIUS}&_type=json`;

  try {
    const response = await axios.get(url);
    const items = response.data?.response?.body?.items?.item;

    if (!items || (Array.isArray(items) && items.length === 0)) {
      console.log("반경 내에 정류장이 없습니다.");
      return;
    }

    const stations = Array.isArray(items) ? items : [items];

    console.log("반경 %d m 내 정류장 목록:", RADIUS);
    stations.forEach((stn, i) => {
      console.log("======== 정류장 %d ========", i + 1);
      console.log("정류장명: %s", stn.nodenm);
      console.log("정류장 ID: %s", stn.nodeid);
      console.log("거리: %s m", stn.dist);
      console.log("위도: %s", stn.gpslati);
      console.log("경도: %s", stn.gpslong);
      console.log("");
    });
  } catch (err) {
    console.error("API 호출 실패:", err.message);
  }
}

fetchNearbyStations();

