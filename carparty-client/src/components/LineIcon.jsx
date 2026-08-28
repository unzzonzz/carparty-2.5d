/* 이 UI 의 아이콘은 전부 같은 규격의 24×24 라인 아이콘이다.
   반복되는 stroke 속성을 한 곳에 모아 각 아이콘은 path 만 넘긴다. */
export default function LineIcon({ width = 1.75, className, children }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
