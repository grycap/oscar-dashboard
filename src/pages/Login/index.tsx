import DocumentTitle from "@/components/DocumentTitle";
import OscarColors, { ColorWithOpacity } from "@/styles";
import BigLogo from "@/assets/oscar-big.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EgiSvg from "@/assets/egi.svg";
import { FormEvent, useContext, useEffect } from "react";
import { getInfoApi } from "@/services/info/getInfoApi";
import { AuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { alert } from "@/lib/alert";

function Login() {
  const navigate = useNavigate();
  const { authData, setAuthData } = useContext(AuthContext);
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const endpoint = formData.get("endpoint") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Check if the endpoint is a valid URL
    if (!endpoint.match(/^(http|https):\/\/[^ "]+$/)) {
      alert.error("Invalid endpoint");
      return;
    }

    try {
      await getInfoApi({ endpoint, username, password });

      setAuthData({
        authenticated: true,
        user: username,
        password,
        endpoint,
      });
    } catch (error) {
      alert.error("Invalid credentials");
    }
  }

  useEffect(() => {
    if (authData?.authenticated) {
      navigate("/");
    }
  }, [authData]);

  return (
    <>
      <DocumentTitle value="Login" />
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: ColorWithOpacity(OscarColors.Green1, 0.75),
        }}
      >
        <div
          style={{
            position: "relative",
            paddingBottom: "100px",
          }}
        >
          <div
            style={{
              position: "absolute",
              background: "#FFFFFF50",
              border: `1px solid ${OscarColors.Green1}`,
              width: "100%",
              height: "100px",
              bottom: 50,
              borderRadius: "0 0 30px 30px",
              zIndex: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: "50px",
              }}
            ></div>
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "10px",
                color: "rgba(0,0,0,0.5)",
                padding: "0 20px",
              }}
            >
              <div>
                © 2021 <a href="https://oscar.grycap.net">Oscar</a>
              </div>
              <div>
                <a href="https://grycap.upv.es/">GRyCAP-I3M-UPV</a>, Universitat
                Politècnica de València, Spain.
              </div>
            </div>
          </div>
          <section
            style={{
              zIndex: 2,
              borderRadius: "30px",
              display: "flex",
              flexDirection: "column",
              background: "white",
              alignItems: "center",
              padding: "36px 48px",
              gap: "26px",
              border: `1px solid ${OscarColors.Green1}`,
              position: "relative",
            }}
          >
            <img src={BigLogo} alt="Oscar logo" width={320} />
            <form
              onSubmit={handleLogin}
              style={{
                width: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <Input name="endpoint" placeholder="Endpoint" />
              <Input name="username" type="text" placeholder="Username" />
              <Input name="password" type="password" placeholder="Password" />

              <Button
                type="submit"
                size={"sm"}
                style={{
                  background: OscarColors.Green4,
                }}
              >
                Login
              </Button>
            </form>
            <Separator />
            <Button
              size="sm"
              style={{
                width: "100%",
                background: OscarColors.Blue,
              }}
            >
              <img
                src={EgiSvg}
                alt="EGI Check-in"
                style={{
                  width: "24px",
                  marginRight: "10px",
                }}
              />
              Login via EGI Check-in
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}

export default Login;
