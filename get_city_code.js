const fs = require('fs');
const readline = require('readline');
const path = require('path');

// 파일 경로
const filePath = path.join(__dirname, 'city_codes.json');

// 파일 존재 여부 확인
if (!fs.existsSync(filePath)) {
    console.error("city_codes.json 파일이 존재하지 않습니다. 먼저 save_city_codes.js를 실행하세요.");
    process.exit(1);
}

// JSON 파일 로드
const cityCodeMap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const cityNames = Object.keys(cityCodeMap);

// 도시 목록 출력
console.log("도시 목록:");
cityNames.forEach((name, idx) => {
    console.log("%d. %s", idx + 1, name);
});

// 사용자 입력 대기
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("\n도시 번호를 선택하세요: ", (answer) => {
    const index = parseInt(answer.trim(), 10) - 1;
    if (index < 0 || index >= cityNames.length || isNaN(index)) {
        console.error("잘못된 입력입니다.");
        rl.close();
        process.exit(1);
    }

    const selectedCity = cityNames[index];
    const selectedCode = cityCodeMap[selectedCity];

    console.log("\n선택한 도시: %s", selectedCity);
    console.log("도시코드: %s", selectedCode);

    rl.close();
});

