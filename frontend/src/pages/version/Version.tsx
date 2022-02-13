import { FC } from "react";
import { useVersion } from "src/graphql";

const Version: FC = () => {
  const { loading, data } = useVersion();

  if (loading || !data) return null;

  let link = "";
  switch (data.version.build_type) {
    case "OFFICIAL":
      link = `https://github.com/stashapp/stash-box/releases/tag/v${data.version.version}`;
      break;
    case "DEVELOPMENT":
    case "PR":
      link = `https://github.com/stashapp/stash-box/commit/${data.version.hash}`;
      break;
  }

  return (
    <dl>
      <dt>Version</dt>
      <dd>
        {link ? (
          <a href={link}>{data.version.version}</a>
        ) : (
          <span>{data.version.version}</span>
        )}
      </dd>
      <dt>Build Type</dt>
      <dd>{data.version.build_type}</dd>
      <dt>Build Hash</dt>
      <dd>{data.version.hash}</dd>
      <dt>Build Time</dt>
      <dd>{data.version.build_time}</dd>
    </dl>
  );
};

export default Version;
