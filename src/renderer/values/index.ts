import "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

function randomIndex(minimum: number, maximum: number): number {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

function shuffleSelf<T>(array: T[], size = array.length): T[] {
  const lastIndex = array.length - 1;
  for (let index = 0; index < size; index += 1) {
    const selectedIndex = randomIndex(index, lastIndex);
    const value = array[selectedIndex];
    array[selectedIndex] = array[index];
    array[index] = value;
  }
  array.length = size;
  return array;
}

function objectValues<T>(value: Record<string, T> | null | undefined): T[] {
  if (value == null) return [];
  return Object.keys(value).map((key) => value[key]);
}

export { shuffleSelf as n, objectValues as t };
