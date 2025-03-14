import { useState } from "react";
import { Button, ButtonProps } from "../ui/button";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import useMeasure from "react-use-measure";

type Props = {
  request: () => Promise<void>;
  icon?: React.ReactNode;
} & ButtonProps;

/**
 * RequestButton is a button that makes a request when clicked showing a loader when the request is in progress.
 *
 * @param {React.ReactNode} children - The children of the button.
 * @param {() => Promise<void>} request - The request function to be called when the button is clicked.
 * @param {ButtonProps} props - The props of the button.
 */
function RequestButton({
  children,
  request,
  icon = <Loader2 className="animate-spin" />,
  ...props
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const [ref, bounds] = useMeasure();

  async function onClick() {
    if (props.disabled) return;
    if (isLoading) return; // Evita múltiples clics
    setIsLoading(true);
    await request();
    setIsLoading(false);
  }

  return (
    <MotionConfig transition={{ duration: 0.2, type: "spring", bounce: 0 }}>
      <Button onClick={onClick} {...props} asChild>
        <motion.div
          initial={{ width: "max-content", minWidth: "80px" }}
          animate={{ width: bounds.width }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              cursor: "pointer",
            }}
            ref={ref}
          >
            <AnimatePresence mode="popLayout">
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {icon}
                </motion.div>
              )}
            </AnimatePresence>
            {children}
          </div>
        </motion.div>
      </Button>
    </MotionConfig>
  );
}

export default RequestButton;
