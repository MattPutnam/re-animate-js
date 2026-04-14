type Props = { code: string };

export const CodeSnippet = ({ code }: Props) => (
  <pre>
    <code>{code}</code>
  </pre>
);
