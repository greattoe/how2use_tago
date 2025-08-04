const axios = require('axios');

const SERVICE_KEY = "your_encoded_authorization_key";

// 기준 좌표 (강호항공고등학교 )
const LAT = 35.428588;
const LNG = 126.693797;
const RADIUS = 500; // 반경 (m)

// 거리 계산 함수 (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 지구 반지름 (m)
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

async function fetchNearbyStations() {
  const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList` +
              `?serviceKey=${SERVICE_KEY}&gpsLati=${LAT}&gpsLong=${LNG}&radius=5000&_type=json`;

  try {
    const response = await axios.get(url);
    const items = response.data?.response?.body?.items?.item;

    if (!items || (Array.isArray(items) && items.length === 0)) {
      console.log("반경 내 정류장이 없습니다.");
      return;
    }

    const stations = Array.isArray(items) ? items : [items];

    // 거리 직접 계산 후 반경 1000m 이내만 필터링
    const filtered = stations.map(stn => {
      const dist = haversine(LAT, LNG, parseFloat(stn.gpslati), parseFloat(stn.gpslong));
      return { ...stn, dist };
    }).filter(stn => stn.dist <= RADIUS);

    if (filtered.length === 0) {
      console.log("반경 %d m 이내에 정류장이 없습니다.", RADIUS);
      return;
    }

    console.log("반경 %d m 내 정류장 목록 (거리 직접 계산):", RADIUS);
    filtered.forEach((stn, i) => {
      console.log("======== 정류장 %d ========", i + 1);
      console.log("정류장명: %s", stn.nodenm);
      console.log("정류장 ID: %s", stn.nodeid);
      console.log("거리: %d m", stn.dist);
      console.log("위도: %s", stn.gpslati);
      console.log("경도: %s", stn.gpslong);
      console.log("");
    });

  } catch (err) {
    console.error("API 호출 실패: %s", err.message);
  }
}

fetchNearbyStations();

