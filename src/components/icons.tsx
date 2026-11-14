import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg(props: IconProps) {
  return <svg viewBox="0 0 20 20" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props} />;
}

export function PaperclipIcon(props: IconProps) {
  return (
    <Svg fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" {...props}>
      <path d="m15.5 9.2-5.6 5.6a3.4 3.4 0 0 1-4.8-4.8l6-6a2.3 2.3 0 0 1 3.2 3.2l-6 6a1.1 1.1 0 0 1-1.6-1.6l5.6-5.6" />
    </Svg>
  );
}
