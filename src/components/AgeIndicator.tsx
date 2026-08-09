import { ageBucket, classNames, relativeTime } from "@/utils";

export function AgeIndicator({ ts }: { ts: number }) {
  const bucket = ageBucket(ts);
  return (
    <span className={classNames("small", `age-${bucket}`)} title={new Date(ts).toISOString()}>
      {relativeTime(ts)}
    </span>
  );
}