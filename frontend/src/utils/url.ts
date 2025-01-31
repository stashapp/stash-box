export const cleanURL = (
  regexStr: string | undefined | null,
  url: string,
): string | undefined => {
  if (!regexStr) return;

  const regex = new RegExp(regexStr);
  const match = regex.exec(url);

  if (match == null || match.length < 2) {
    return match?.[1];
  } else {
    match.shift();
    return match.join("");
  }
};
