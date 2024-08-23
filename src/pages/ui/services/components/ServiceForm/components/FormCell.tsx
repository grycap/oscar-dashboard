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
        flexDirection: "row",
        width: "100%",
        padding: 18,
        margin: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <h2
          style={{
            color: OscarColors.DarkGrayText,
            fontSize: 14,
          }}
        >
          {title}
        </h2>

        <div
          style={{
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            padding: "18px 0px 18px 18px",
            display: "flex",
            width: "100%",
            gap: 18,
            alignItems: "end",
          }}
        >
          {children}
        </div>
      </div>
      {button}
    </div>
  );
}

export default ServiceFormCell;
