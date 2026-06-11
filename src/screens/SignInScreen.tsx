import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { signIn } from "@/lib/auth-store";
import { track } from "@/lib/events";
import { identifyUser } from "@/apex";
import { fadeUp, listContainer } from "@/brand/motion";

export function SignInScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.warning("Email and password required");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    const user = signIn(email.trim());
    // Phase 2-sample — identify before track. See SignUpScreen for
    // ordering rationale. user_signed_in is NOT on the auto-stitch
    // whitelist (CSO: shared-device collision risk), so identify is
    // the only path that promotes the Contact on a sign-in.
    await identifyUser({
      email: user.email,
      userId: user.id,
      traits: { name: user.name },
    });
    void track("user_signed_in", {
      userId: user.id,
      email: user.email,
    });
    toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
    navigate("/account");
  };

  return (
    <>
      <Header showBack title="Sign in" />
      <motion.form
        onSubmit={handleSubmit}
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 px-5 pt-4"
      >
        <motion.div variants={fadeUp} className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back.</h1>
          <p className="text-sm text-fg-muted">
            Sign in to keep your cart, wishlist, and order history in sync.
          </p>
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            iconLeft={<Lock className="size-4" />}
            autoComplete="current-password"
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
            Sign in
          </Button>
        </motion.div>
        <motion.p variants={fadeUp} className="text-center text-sm text-fg-muted">
          New here?{" "}
          <Link to="/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </motion.p>
      </motion.form>
    </>
  );
}
