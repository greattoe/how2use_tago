const axios = require('axios');
const fs = require('fs');

const encodedKey = 'ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D';
const url = `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getCtyCodeList?serviceKey=${encodedKey}&_type=json`;

async function saveCityCodes() {
    try {
        const res = await axios.get(url, {
            headers: { Accept: 'application/json' }
        });

        const items = res.data?.response?.body?.items?.item;

        if (!items) {
            console.error("예상과 다른 응답 구조:\n", JSON.stringify(res.data, null, 2));
            return;
        }

        const cityList = Array.isArray(items) ? items : [items];

        // JSON 파일로 저장
        fs.writeFileSync('city_codes.json', JSON.stringify(cityList, null, 2), 'utf8');
        console.log("도시코드 %d개를 city_codes.json에 저장했습니다.", cityList.length);

    } catch (err) {
        if (err.response) {
            console.error("응답 오류:\n", err.response.data);
        } else {
            console.error("요청 실패: %s", err.message);
        }
    }
}

saveCityCodes();

