const axios = require('axios');
const readline = require('readline');

const encodedKey = 'ygh%2F%2F8luC%2BEBKC6eahxb3VZZI5R27EQgk2T%2Bh%2BqryD5QK%2FXMbGnR2%2B0%2FSAE3C6slREn8QKOrZEXEPj7WPl0Tzw%3D%3D';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function getRouteId(cityCode, routeNo) {
    const url = `http://apis.data.go.kr/1613000/BusRouteInfoInqireService/getBusRouteList?serviceKey=${encodedKey}&_type=json&cityCode=${cityCode}&routeNo=${routeNo}`;

    try {
        const res = await axios.get(url, {
            headers: { Accept: 'application/json' }
        });

        const items = res.data?.response?.body?.items?.item;
        if (!items) {
            console.error("노선 정보를 찾을 수 없습니다:\n", JSON.stringify(res.data, null, 2));
            return;
        }

        const routeList = Array.isArray(items) ? items : [items];
        routeList.forEach((route, idx) => {
            console.log("%d: 노선번호: %s / 노선ID: %s", idx + 1, route.routeno, route.routeid);
        });

    } catch (err) {
        if (err.response) {
            console.error("응답 오류:\n", err.response.data);
        } else {
            console.error("요청 실패: %s", err.message);
        }
    }
}

async function main() {
    const cityCode = await ask("도시코드 입력 (예: 31100): ");
    const routeNo = await ask("버스 번호 입력 (예: 720-1): ");
    rl.close();

    await getRouteId(cityCode, routeNo);
}

main();

