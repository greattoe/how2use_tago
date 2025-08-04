const axios = require('axios');
const fs = require('fs');

const encodedKey = 'ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D';

const LAT = 35.425063;
const LON = 126.699997;
const RADIUS = 1000;  // 1km

const url = `http://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList` +
            `?serviceKey=${encodedKey}&_type=json&gpsLati=${LAT}&gpsLong=${LON}&radius=${RADIUS}`;

async function searchNearbyStations() {
    try {
        const res = await axios.get(url, {
            headers: { Accept: 'application/json' }
        });

        const items = res.data?.response?.body?.items?.item;
        if (!items) {
            console.log("정류장 없음 (lat: %f, lon: %f)", LAT, LON);
            return;
        }

        const stationList = Array.isArray(items) ? items : [items];

        console.log("반경 %d m 내 정류장 %d곳:\n", RADIUS, stationList.length);
        stationList.forEach((station, idx) => {
            console.log("%d: %s (ID: %s, 방향: %s)", idx + 1, station.nodenm, station.nodeid, station.turn);
        });

        fs.writeFileSync('stations_1km.json', JSON.stringify(stationList, null, 2), 'utf8');
        console.log("\nstations_1km.json 저장 완료");

    } catch (err) {
        if (err.response) {
            console.error("응답 오류:\n", err.response.data);
        } else {
            console.error("요청 실패: %s", err.message);
        }
    }
}

searchNearbyStations();

