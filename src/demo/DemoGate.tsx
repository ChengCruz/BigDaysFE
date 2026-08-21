// src/demo/DemoGate.tsx
//
// The signup prompt shown when a demo visitor reaches something the demo cannot
// honestly do for them.
//
// Used only where the boundary is real — taking the guest list away as a file,
// publishing a share link, minting QR codes. Deliberately NOT used to hide
// working features: a visitor can tell the difference between "this needs an
// account" and "this was hidden to make me sign up", and the second reads as
// bait. The floor plan in particular stays fully open, because it is the most
// persuasive thing in the product and nobody signs up for a blur.

import { useNavigate } from "react-router";

import { Modal } from "../components/molecules/Modal";
import { Button } from "../components/atoms/Button";
import { trackEvent } from "../utils/analytics";
import { exitDemo } from "./demoMode";

interface DemoGateProps {
  isOpen: boolean;
  onClose: () => void;
  /** Short noun phrase for what they tried to do, e.g. "export your guest list". */
  action: string;
  /** Why an account is genuinely needed. One sentence, no marketing. */
  reason: string;
  /** Distinguishes gates in analytics. */
  source: string;
}

export function DemoGate({ isOpen, onClose, action, reason, source }: DemoGateProps) {
  const navigate = useNavigate();

  const register = () => {
    trackEvent("demo_cta_click", { from: source });
    exitDemo();
    navigate("/register");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create a free account to ${action}`} showCloseButton>
      <p className="text-sm text-text/70 dark:text-white/70">{reason}</p>
      <p className="mt-3 text-sm text-text/70 dark:text-white/70">
        It takes a minute, and you'll start with an empty wedding of your own —
        nothing from this sample carries over.
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Keep looking around
        </Button>
        <Button onClick={register}>Start my own wedding</Button>
      </div>
    </Modal>
  );
}
