import OscarColors from "@/styles";

interface Props {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  button?: React.ReactNode;
}

function ServiceFormCell({ title, subtitle, children, button }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: 18,
        margin: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              color: OscarColors.DarkGrayText,
              fontSize: 14,
            }}
          >
            {title}
          </h1>
          <h2
            style={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            {subtitle}
          </h2>
        </div>
        {button}
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          gap: 18,
          alignItems: "end",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ServiceFormCell;
