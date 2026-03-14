import { Suspense } from "react";
import {
  enrichTweet,
  type EnrichedTweet,
  type TweetProps,
  type TwitterComponents,
} from "react-tweet";
import { getTweet, type Tweet } from "react-tweet/api";

interface ExtendedTweetUser {
  highlighted_label?: {
    badge?: { url: string };
    description?: string;
  };
}

interface ExtendedEnrichedTweet extends EnrichedTweet {
  retweet_count?: number;
}

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      fill="currentColor"
      d="M13.3174 10.7749L19.1457 4H17.7646L12.7852 9.88168L8.80545 4H4L10.0201 13.1262L4 20.0863H5.38119L10.5515 14.0195L14.6968 20.0863H19.5023L13.3174 10.7749ZM11.1305 13.198L10.4926 12.2642L5.96001 5.52803H8.10554L11.6742 10.8722L12.3121 11.806L17.0202 18.9537H14.8747L11.1305 13.198Z"
    />
  </svg>
);

const Verified = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 22 22" aria-label="Verified Account" className={className}>
    <path
      fill="currentColor"
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
    />
  </svg>
);

const TweetHeader = ({ tweet }: { tweet: EnrichedTweet }) => {
  const formattedDate = new Date(tweet.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const companyBadge = (tweet.user as unknown as ExtendedTweetUser)
    .highlighted_label?.badge?.url;

  return (
    <div className="flex items-start justify-between px-4 pt-4">
      <div className="flex items-center gap-3">
        <a
          href={`https://x.com/${tweet.user.screen_name}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
        >
          <img
            src={tweet.user.profile_image_url_https}
            alt={tweet.user.screen_name}
            width={48}
            height={48}
            className="size-12 !m-0 rounded-full"
          />
        </a>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <a
              href={`https://x.com/${tweet.user.screen_name}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--color-foreground)] hover:underline"
            >
              {tweet.user.name}
            </a>
            {tweet.user.is_blue_verified && (
              <Verified className="size-[18px] text-[#1D9BF0]" />
            )}
            {companyBadge && (
              <img
                src={companyBadge}
                alt=""
                className="ml-0.5 size-4 rounded-full"
              />
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-[var(--color-foreground-3)]">
            <span>@{tweet.user.screen_name}</span>
            <span>&middot;</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
      <a
        href={`https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`}
        target="_blank"
        rel="noreferrer"
        className="text-[var(--color-foreground-3)] hover:text-[var(--color-foreground)] transition-colors"
      >
        <XLogo className="size-5" />
      </a>
    </div>
  );
};

const TweetBody = ({ tweet }: { tweet: EnrichedTweet }) => (
  <div className="px-4 pt-3 text-[15px] leading-relaxed text-[var(--color-foreground)]">
    {tweet.entities.map((entity, i) => {
      switch (entity.type) {
        case "url":
        case "symbol":
          return (
            <a
              key={i}
              href={(entity as any).href}
              target="_blank"
              rel="noreferrer"
              className="text-[#1D9BF0] hover:underline"
            >
              {(entity as any).displayUrl ?? entity.text}
            </a>
          );
        case "hashtag":
          return (
            <a
              key={i}
              href={`https://x.com/hashtag/${entity.text.replace("#", "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#1D9BF0] hover:underline"
            >
              {entity.text}
            </a>
          );
        case "mention":
          return (
            <a
              key={i}
              href={`https://x.com/${entity.text.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#1D9BF0] hover:underline"
            >
              {entity.text}
            </a>
          );
        default:
          return <span key={i}>{entity.text}</span>;
      }
    })}
  </div>
);

const TweetMedia = ({ tweet }: { tweet: EnrichedTweet }) => {
  if (!tweet.video && !tweet.photos) return null;
  return (
    <div className="mt-3 px-4">
      {tweet.video && (
        <video
          poster={tweet.video.poster}
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-xl border border-[var(--color-ui)]/20"
        >
          <source src={tweet.video.variants[0].src} type="video/mp4" />
        </video>
      )}
      {tweet.photos && tweet.photos.length === 1 && (
        <img
          src={tweet.photos[0].url}
          alt={tweet.text}
          className="w-full !m-0 rounded-xl border border-[var(--color-ui)]/20 object-cover"
        />
      )}
      {tweet.photos && tweet.photos.length > 1 && (
        <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-[var(--color-ui)]/20">
          {tweet.photos.map((photo) => (
            <img
              key={photo.url}
              src={photo.url}
              alt={tweet.text}
              className="aspect-video w-full !m-0 object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TweetActions = ({ tweet }: { tweet: EnrichedTweet }) => {
  const replies = tweet.conversation_count || 0;
  const retweets =
    (tweet as unknown as ExtendedEnrichedTweet).retweet_count || 0;
  const likes = tweet.favorite_count || 0;

  const fmt = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <a
      href={`https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-5 px-4 pb-4 pt-3 text-[13px] text-[var(--color-foreground-3)]"
    >
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="size-[18px]">
          <path
            fill="currentColor"
            d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"
          />
        </svg>
        {fmt(replies)}
      </span>
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="size-[18px]">
          <path
            fill="currentColor"
            d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"
          />
        </svg>
        {fmt(retweets)}
      </span>
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="size-[18px]">
          <path
            fill="currentColor"
            d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"
          />
        </svg>
        {fmt(likes)}
      </span>
    </a>
  );
};

const TweetSkeleton = () => (
  <div className="not-prose my-6 flex w-full flex-col gap-3 rounded-xl border border-[var(--color-ui)]/20 bg-[var(--color-background-2)] p-5">
    <div className="flex flex-row gap-3">
      <div className="size-12 shrink-0 rounded-full bg-[var(--color-ui)]/10 animate-pulse" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-32 rounded bg-[var(--color-ui)]/10 animate-pulse" />
        <div className="h-3 w-24 rounded bg-[var(--color-ui)]/10 animate-pulse" />
      </div>
    </div>
    <div className="h-16 w-full rounded bg-[var(--color-ui)]/10 animate-pulse" />
  </div>
);

const TweetNotFound = () => (
  <div className="not-prose my-6 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-[var(--color-ui)]/20 bg-[var(--color-background-2)] p-8 text-[var(--color-foreground-3)]">
    <XLogo className="mb-1 size-8 opacity-40" />
    <p className="text-sm">Tweet not found</p>
  </div>
);

const MagicTweet = ({ tweet }: { tweet: Tweet }) => {
  const enrichedTweet = enrichTweet(tweet);

  return (
    <div className="not-prose my-6 w-full overflow-hidden rounded-xl border border-[var(--color-ui)]/20 bg-[var(--color-background-2)] transition-colors hover:border-[var(--color-ui)]/40">
      <TweetHeader tweet={enrichedTweet} />
      <TweetBody tweet={enrichedTweet} />
      <TweetMedia tweet={enrichedTweet} />
      <TweetActions tweet={enrichedTweet} />
    </div>
  );
};

export const TweetCard = async ({
  id,
  components,
  fallback = <TweetSkeleton />,
  onError,
  ...props
}: TweetProps & { className?: string }) => {
  const tweet = id
    ? await getTweet(id).catch((err) => {
        if (onError) onError(err);
        else console.error(err);
      })
    : undefined;

  if (!tweet) {
    const NotFound = components?.TweetNotFound || TweetNotFound;
    return <NotFound {...props} />;
  }

  return (
    <Suspense fallback={fallback}>
      <MagicTweet tweet={tweet} />
    </Suspense>
  );
};
