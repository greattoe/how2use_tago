const axios = require('axios');

const encodedKey = "your_encoded_authorization_key";

const url = `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getCtyCodeList?serviceKey=${encodedKey}&_type=json`;

async function getCityCodes() {
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
        cityList.forEach((city, idx) => {
            console.log("%d: 도시명: %s / 도시코드: %s", idx + 1, city.cityname, city.citycode);
        });
    } catch (err) {
        if (err.response) {
            console.error("응답 오류:\n", err.response.data);
        } else {
            console.error("요청 실패: %s", err.message);
        }
    }
}

getCityCodes();

