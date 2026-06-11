import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { signUp } from "@/lib/auth-store";
import { track } from "@/lib/events";
import { identifyUser } from "@/apex";
import { fadeUp, listContainer } from "@/brand/motion";

export function SignUpScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.warning("All fields are required");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    const user = signUp(email.trim(), name.trim());
    // Phase 2-sample — call Apex.identify BEFORE track("user_signed_up").
    // identify performs the durable visitor->Contact stitch in verified
    // mode (server stamps verifiedAt = now). The subsequent track event
    // then triggers the server-side quarantine-mode auto-stitch path
    // but finds an already-verified Contact, so it's a no-op promotion.
    // Ordering matters: track first would leave the Contact quarantined
    // until identify lands, suppressing affiliate/score/journey
    // dispatch for an arbitrary window.
    await identifyUser({
      email: user.email,
      userId: user.id,
      traits: { name: user.name, signedUpAt: user.signedUpAt },
    });
    void track("user_signed_up", {
      userId: user.id,
      email: user.email,
      signedUpAt: user.signedUpAt,
    });
    toast.success(`Welcome, ${user.name.split(" ")[0]}`, "Apex sees you now.");
    navigate("/account");
  };

  return (
    <>
      <Header showBack title="Create account" />
      <motion.form
        onSubmit={handleSubmit}
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 px-5 pt-4"
      >
        <motion.div variants={fadeUp} className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Get started.</h1>
          <p className="text-sm text-fg-muted">
            Your Apex Outfitters account stitches your events together so the
            dashboard knows it's you.
          </p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <TextField
            id="name"
            label="Full name"
            placeholder="Ari Demo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            iconLeft={<User className="size-4" />}
            autoComplete="name"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <TextField
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            iconLeft={<Mail className="size-4" />}
            autoComplete="email"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <TextField
            id="password"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            iconLeft={<Lock className="size-4" />}
            autoComplete="new-password"
            hint="Any password works — auth is mocked in this app."
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
            iconRight={<ArrowRight className="size-4" />}
          >
            Create account
          </Button>
        </motion.div>
        <motion.p variants={fadeUp} className="text-center text-sm text-fg-muted">
          Already have an account?{" "}
          <Link to="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </motion.p>
      </motion.form>
    </>
  );
}
