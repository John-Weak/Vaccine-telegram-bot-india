export function sleep(ms = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDate() {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const nd = new Date(utc + 3600000 * +5.5).toLocaleDateString();

  const val = nd.split(/[/]+/);
  for (let i = 0; i < 2; i++) {
    const element = +val[i];
    if (element <= 9) val[i] = `0${element}`;
  }
  let ans = "";
  ans += val[0] + "-";
  ans += val[1] + "-";
  ans += val[2];

  return ans;
}

