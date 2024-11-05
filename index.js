const substitutionTable = [
    [6,12,7,1,5,15,13,8,4,10,9,14,0,3,11,2],
    [14,11,4,12,6,13,15,10,2,3,8,1,0,7,5,9],
    [13,11,4,1,3,15,5,9,0,10,14,7,6,8,2,12],
    [7,13,10,1,0,8,9,15,14,4,6,12,11,2,5,3],
    [1,15,13,0,5,7,10,4,9,2,3,14,6,11,8,12],
    [4,10,9,2,13,8,0,14,6,11,1,12,7,15,5,3],
    [4,11,10,0,7,2,1,13,3,6,8,5,9,12,15,14],
    [5,8,1,13,10,3,4,2,14,15,12,7,6,0,9,11]
];

const keysTable = [];

const text = document.querySelector(".text");
const key = document.querySelector(".key");

const encryptBtn = document.querySelector(".encrypt-button");
const decryptBtn = document.querySelector(".decrypt-button");
const clearBtn = document.querySelector(".clear-button");
const resultText = document.querySelector(".result-text");

encryptBtn.addEventListener("click", getEncryptedText);
decryptBtn.addEventListener("click", getDecryptedText);
clearBtn.addEventListener("click", clear);

function getEncryptedText(){
    resultText.innerHTML = "";

    const inputText = text.value;

    const inputKey = key.value;
    const bytes = new TextEncoder().encode(inputKey);

    const hexValues = Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0'));
    const hexString = hexValues.join(' ');
    const hexKeys = hexString.split(/\s+/);

    keysTable.length = 0;

    for (let hexKey of hexKeys) {
        if (hexKey) {
            const bigIntKey = BigInt("0x" + hexKey.trim());
            keysTable.push(bigIntKey);
        }
    }

    const textToBit = textToBitBlocks(inputText);

    let textEncrypted = [];

    for (let i = 0; i < textToBit.length; i++) {
        const indexKey = getKeyFlow(i);

        const decimalValue = parseInt(indexKey, 16);
        const binaryString = decimalValue.toString(2).padStart(4, '0');

        textEncrypted[i] = textToBit[i] ^ Number(binaryString[0]);
    }

    clearBtn.style.display = "block";
    resultText.style.opacity = "1";
    resultText.innerHTML = resultText.innerHTML + textEncrypted.join('');
}

function getDecryptedText() {
    resultText.innerHTML = "";

    const inputText = text.value;

    const textArr = Array.from(inputText).map(Number);

    let bitsDecrypted = [];

    for (let i = 0; i < textArr.length; i++) {
        let indexKey = getKeyFlow(i);

        const decimalValue = parseInt(indexKey, 16);
        const binaryString = decimalValue.toString(2).padStart(4, '0');

        bitsDecrypted[i] = textArr[i] ^ Number(binaryString[0]);
    }

    const textDecrypted = bitToText(bitsDecrypted);

    clearBtn.style.display = "block";
    resultText.style.opacity = "1";
    resultText.innerHTML = resultText.innerHTML + textDecrypted;
}

function textToBitBlocks(inputText) {
    const bits = [];
    const bytes = new TextEncoder().encode(inputText);

    for (let byte of bytes) {
        for (let i = 7; i >= 0; i--) {
            bits.push((byte >> i) & 1);
        }
    }

    return bits;
}

function bitToText(bitBlocks) {
    const bytes = [];

    for (let i = 0; i < bitBlocks.length; i += 8) {
        let byte = 0;

        for (let j = 0; j < 8; j++) {
                byte |= (bitBlocks[i + j] << (7 - j));
        }

        bytes.push(byte);
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
}

function getKeyFlow(i) {
    const blocks = textToBlocks(i);
    const encryptedBlocks = blocks.map(block => stepsEncrypt(block));

    let encryptedKey = '';
    for (let i = 0; i < encryptedBlocks.length; i++) {
        let block = encryptedBlocks[i].toString(16).padStart(16, '0');
        encryptedKey += block + ' ';
    }

    encryptedKey = encryptedKey.trim();

    return encryptedKey;
}

function textToBlocks(text) {
    const blocks = [];
    const bytes = new TextEncoder().encode(text);

    for (let i = 0; i < bytes.length; i += 8) {
        let block = BigInt(0);
        for (let j = 0; j < 8; j++) {
            if (i + j < bytes.length) {
                block |= BigInt(bytes[i + j]) << (8n * BigInt(j));
            }
        }
        blocks.push(block);
    }

    return blocks;
}

function stepsEncrypt (block) {
    let L = Number(block >> 32n) >>> 0;
    let R = Number(block & 0xFFFFFFFFn) >>> 0;

    for (let i = 0; i < 32; i++) {
        const indexKey = (i < 24) ? Number(keysTable[i % 8]) : Number(keysTable[7 - (i % 8)]);
        [L, R] = encryptRound(L, R, indexKey);
    }

    return (BigInt(L) << 32n) | BigInt(R);
}

function encryptRound(inputL, inputR, indexKey) {
    const outputL = inputR;
    const outputR = (inputL ^ transformationsInRound(inputR, indexKey)) >>> 0;

    return [outputL, outputR];
}

function transformationsInRound(right, keyIndex) {
    right = (right + keyIndex) >>> 0;
    right = substitutionOnTableValues(right);

    return ((right << 11) | (right >>> 21)) >>> 0;
}

function substitutionOnTableValues(right) {
    let result = 0;
    for (let i = 0; i < 8; i++) {
        result |= (substitutionTable[i][(right >> (4 * i)) & 0xf] << (4 * i));
    }

    return result >>> 0;
}

function clear() {
    resultText.innerHTML = "";
    resultText.style.opacity = "0";
    clearBtn.style.display = "none";
}