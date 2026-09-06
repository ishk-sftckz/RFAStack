export function Icon({ name = 'box' }: { name?: 'box' | 'arrow' | 'check' | 'truck' | 'bag' }) {
  const paths = {
    box: 'M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Zm0 9L3 7.5m9 4.5 9-4.5M12 12v9M7.5 5.25l9 4.5',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    check: 'm5 12 4 4L19 6',
    truck: 'M3 5h11v12H3V5Zm11 5h4l3 4v3h-7M7 17v.01M17 17v.01',
    bag: 'M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  }
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
