export type Player = number;

export interface Team {
  players: [Player, Player];
}

export interface Match {
  teamA: Team;
  teamB: Team;
  waiting: Player[];
}

const MAX_MATCHES = 10;

// n人での実際の試合数
// 制約1: MAX_MATCHES上限
// 制約2: 1試合で2ペア消費するため C(n,2)÷2 が上限
export function calcMatchCount(n: number): number {
  if (n < 4) return 0;
  const pairs = (n * (n - 1)) / 2; // C(n,2)
  const pairLimit = Math.floor(pairs / 2);
  return Math.min(MAX_MATCHES, pairLimit);
}

function buildAllMatches(players: Player[]): Match[] {
  const n = players.length;
  const all: Match[] = [];
  for (let ai = 0; ai < n - 3; ai++) {
    for (let bi = ai + 1; bi < n - 2; bi++) {
      for (let ci = bi + 1; ci < n - 1; ci++) {
        for (let di = ci + 1; di < n; di++) {
          const a = players[ai], b = players[bi], c = players[ci], d = players[di];
          const group = [a, b, c, d];
          for (const [p1, p2, p3, p4] of [
            [a, b, c, d],
            [a, c, b, d],
            [a, d, b, c],
          ] as [Player, Player, Player, Player][]) {
            all.push({
              teamA: { players: [p1, p2] },
              teamB: { players: [p3, p4] },
              waiting: players.filter((p) => !group.includes(p)),
            });
          }
        }
      }
    }
  }
  return all;
}

// 候補の中からgreedy選択（random=falseなら番号順、trueならランダム）
function pickNext(
  candidates: Match[],
  playCount: Map<Player, number>,
  random: boolean
): number {
  // 均等性スコア: 4人の最大試合数→合計試合数→（random=falseなら番号合計）
  let bestIdxes: number[] = [];
  let bestMax = Infinity;
  let bestSum = Infinity;

  for (let i = 0; i < candidates.length; i++) {
    const four = [
      candidates[i].teamA.players[0],
      candidates[i].teamA.players[1],
      candidates[i].teamB.players[0],
      candidates[i].teamB.players[1],
    ];
    const counts = four.map((p) => playCount.get(p)!);
    const maxC = Math.max(...counts);
    const sumC = counts.reduce((s, c) => s + c, 0);

    if (maxC < bestMax || (maxC === bestMax && sumC < bestSum)) {
      bestMax = maxC;
      bestSum = sumC;
      bestIdxes = [i];
    } else if (maxC === bestMax && sumC === bestSum) {
      bestIdxes.push(i);
    }
  }

  if (random) {
    // 同優先度内はランダム
    return bestIdxes[Math.floor(Math.random() * bestIdxes.length)];
  } else {
    // 同優先度内は番号合計が小さい順
    let bestIdx = bestIdxes[0];
    let bestPlayerSum = Infinity;
    for (const i of bestIdxes) {
      const four = [
        candidates[i].teamA.players[0],
        candidates[i].teamA.players[1],
        candidates[i].teamB.players[0],
        candidates[i].teamB.players[1],
      ];
      const ps = four.reduce((s, p) => s + p, 0);
      if (ps < bestPlayerSum) {
        bestPlayerSum = ps;
        bestIdx = i;
      }
    }
    return bestIdx;
  }
}

function pairKey(a: Player, b: Player): string {
  return a < b ? `${a},${b}` : `${b},${a}`;
}

export function generateMatches(n: number): Match[] {
  const players: Player[] = Array.from({ length: n }, (_, i) => i + 1);
  const allMatches = buildAllMatches(players);
  const playCount = new Map<Player, number>(players.map((p) => [p, 0]));
  const usedPairs = new Set<string>();
  const result: Match[] = [];

  // 使用済みペアを含まない候補のみ残す
  let remaining = [...allMatches];

  while (result.length < MAX_MATCHES && remaining.length > 0) {
    // 使用済みペアを含む試合を除外
    const candidates = remaining.filter((m) => {
      const k1 = pairKey(m.teamA.players[0], m.teamA.players[1]);
      const k2 = pairKey(m.teamB.players[0], m.teamB.players[1]);
      return !usedPairs.has(k1) && !usedPairs.has(k2);
    });

    if (candidates.length === 0) break;

    // 全員が1試合以上するまでは番号順（決定的）、以降はランダム
    const allPlayed = players.every((p) => playCount.get(p)! >= 1);
    const idx = pickNext(candidates, playCount, allPlayed);

    const chosen = candidates[idx];
    result.push(chosen);

    // remainingからも削除
    const ri = remaining.indexOf(chosen);
    remaining.splice(ri, 1);

    // ペアと試合数を記録
    usedPairs.add(pairKey(chosen.teamA.players[0], chosen.teamA.players[1]));
    usedPairs.add(pairKey(chosen.teamB.players[0], chosen.teamB.players[1]));

    for (const p of [
      chosen.teamA.players[0],
      chosen.teamA.players[1],
      chosen.teamB.players[0],
      chosen.teamB.players[1],
    ]) {
      playCount.set(p, playCount.get(p)! + 1);
    }
  }

  return result;
}

