import Head from "expo-router/head";

import { pageUrl } from "../i18n/web";

// Title, description and canonical link of a web document page.
export function DocHead(props: {
  title: string;
  description: string;
  path: string;
}) {
  return (
    <Head>
      <title>{props.title}</title>
      <meta name="description" content={props.description} />
      <link rel="canonical" href={pageUrl(props.path)} />
    </Head>
  );
}
