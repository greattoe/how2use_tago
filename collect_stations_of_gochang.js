// collect_stations_of_gochang.js
const axios = require('axios');
const fs = require('fs');

const encodedKey = 'ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D';
const serviceUrl = 'http://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList';

const gochangAreas = [
    { name: "고창읍", lat: 35.4353, lon: 126.7017 },
    { name: "흥덕면", lat: 35.4970, lon: 126.6057 },
    { name: "성내면", lat: 35.4700, lon: 126.7800 },
    { name: "해리면", lat: 35.3900, lon: 126.6200 },
    { name: "부안면", lat: 35.3400, lon: 126.7650 },
    { name: "심원면", lat: 35.3750, lon: 126.6700 },
    { name: "공음면", lat: 35.4600, lon: 126.5600 },
    { name: "상하면", lat: 35.3300, lon: 126.7200 },
    { name: "대산면", lat: 35.4050, lon: 126.7400 },
    { name: "무장면", lat: 35.4600, lon: 126.6500 }
];

async function fetchStations(lat, lon) {
    const url = `${serviceUrl}?serviceKey=${encodedKey}&_type=json&gpsLati=${lat}&gpsLong=${lon}&radius=10000`;
    try {
        const res = await axios.get(url, {
            headers: { Accept: 'application/json' }
        });
        const items = res.data?.response?.body?.items?.item;
        return Array.isArray(items) ? items : (items ? [items] : []);
    } catch (err) {
        console.error("요청 실패 또는 응답 오류:", err.message);
        return [];
    }
}

function deduplicateStations(stations) {
    const map = new Map();
    stations.forEach(st => {
        map.set(st.nodeid, st); // nodeid 기준 중복 제거
    });
    return Array.from(map.values());
}

(async () => {
    let allStations = [];

    for (const area of gochangAreas) {
        console.log("조회 중: %s", area.name);
        const stations = await fetchStations(area.lat, area.lon);
        if (stations.length === 0) {
            console.log("정류장 없음 (lat: %s, lon: %s)", area.lat, area.lon);
        } else {
            allStations.push(...stations);
        }
    }

    const uniqueStations = deduplicateStations(allStations);
    console.log("총 수집된 고유 정류장 수: %d", uniqueStations.length);

    fs.writeFileSync("stations_gochang.json", JSON.stringify(uniqueStations, null, 2), "utf-8");
    console.log("stations_gochang.json 저장 완료");
})();

