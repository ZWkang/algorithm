import { globby } from "globby";
import path from "path";
import fs from "fs/promises";

const globText = [`**/*.ts`, "!node_modules"];
const root = process.cwd();

const baseReadme = path.join(root, "base-readme.md");
const targetReadme = path.join(root, "README.md");

const ChineseMap = {
  array: "数组",
  backtracking: "回溯",
  binarysearch: "二分查找",
  bit: "位运算",
  doublepointer: "双指针",
  dp: "动态规划",
  hash: "哈希表",
  heap: "堆",
  linked: "链表",
  recursion: "递归",
  slidewindow: "滑动窗口",
  tree: "树",
  string: "字符串",
};

function groupBy(arr: string[][]) {
  const map = new Map();
  for (const item of arr) {
    if (!map.has(item[0])) {
      map.set(item[0], [item[1]]);
    } else {
      map.get(item[0]).push(item[1]);
    }
  }
  return map;
}

async function generatorIndexReadme() {
  const allList = await globby(globText, {
    cwd: root,
  });

  // console.log(allList);
  const allListMaps = allList
    .map((item) => {
      return item.split("/");
    })
    .filter((item) => {
      return item.length === 2;
    });

  const allListMapsGroup = groupBy(allListMaps);

  const keys = allListMapsGroup.keys();
  let text = "";
  for (let key of keys) {
    const val = ChineseMap[key.toLowerCase()];
    text += `## ${val}\n`;

    const list = allListMapsGroup.get(key);
    const fileList: { path: string; ms: number }[] = await Promise.all(
      list.map(async (item) => {
        const mtimeMs = await getFileMTime(
          path.join(root, path.join(key, item))
        );
        return {
          path: path.join(key, item),
          ms: mtimeMs,
        };
      })
    );
    const sortedFileList = fileList.sort((a, b) => a.ms - b.ms);

    for (let item of sortedFileList) {
      text += `- [${path.parse(item.path).name}](./${item.path})\n\n`;
    }
  }
  // console.log(text);
  const content = await fs.readFile(baseReadme, "utf-8");

  const replacedReadme = content.replace("{{ contentSlot }}", text);
  // 写入
  await fs.writeFile(targetReadme, replacedReadme);
}

async function getFileMTime(filePath: string) {
  const info = await fs.lstat(filePath);
  return info.mtimeMs;
}

generatorIndexReadme();
