export function normalizePhoneNumber(value: string): string {
    return value.replace(/\D/g, "").slice(0, 11);
}

export function formatPhoneNumber(value: string): string {
    const digits = normalizePhoneNumber(value);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    const areaCode = digits.slice(0, 2);
    const number = digits.slice(2);
    const blockSize = digits.length >= 11 ? 5 : 4;
    if (number.length <= blockSize) return `(${areaCode}) ${number}`;
    return `(${areaCode}) ${number.slice(0, blockSize)}-${number.slice(blockSize)}`;
}
