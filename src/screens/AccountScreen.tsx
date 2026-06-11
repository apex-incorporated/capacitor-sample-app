import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  ChevronRight,
  Settings as SettingsIcon,
  LogOut,
  Heart,
  Crown,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth, signOut } from "@/lib/auth-store";
import { useSubscription } from "@/lib/subscription-store";
import { track } from "@/lib/events";
import { listContainer, fadeUp } from "@/brand/motion";

export function AccountScreen() {
  const { user } = useAuth();
  const sub = useSubscription();
  const navigate = useNavigate();

  const handleSignOut = () => {
    void track("user_signed_out", { userId: user?.id });
    signOut();
    navigate("/");
  };

  return (
    <>
      <Header large title="Account" />
      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 px-5"
      >
        {/* ── Identity card ──────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center gap-3 px-5 py-5">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <User className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-base font-semibold text-fg">
                    {user ? user.name : "Guest"}
                  </p>
                  <Badge variant={user ? "success" : "neutral"}>
                    {user ? "Signed in" : "Not signed in"}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-fg-muted">
                  {user ? user.email : "Sign in or create an account to get started."}
                </p>
              </div>
            </div>
            {!user && (
              <div className="flex gap-2 px-5 pb-5">
                <Button onClick={() => navigate("/sign-in")} fullWidth>
                  Sign in
                </Button>
                <Button onClick={() => navigate("/sign-up")} variant="secondary" fullWidth>
                  Create account
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── Plus tier upsell / status ─────────────────────────── */}
        <motion.div variants={fadeUp}>
          <RowLink
            to="/subscription"
            icon={Crown}
            label="Apex Outfitters Plus"
            hint={
              sub.status === "trialing"
                ? "Trial active"
                : sub.status === "active"
                  ? "Subscribed"
                  : "Free shipping, early access, members-only drops"
            }
            accent
          />
        </motion.div>

        {/* ── Quick links ────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="space-y-2">
          <RowLink
            to="/account"
            icon={Heart}
            label="Wishlist"
            hint="Coming soon"
            disabled
          />
        </motion.div>

        {/* ── Settings ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <RowLink
            to="/settings"
            icon={SettingsIcon}
            label="Apex settings"
            hint="Project key, API URL, test mode"
          />
        </motion.div>

        {user && (
          <motion.div variants={fadeUp}>
            <Button
              variant="ghost"
              fullWidth
              iconLeft={<LogOut className="size-4" />}
              onClick={handleSignOut}
              className="text-danger hover:bg-danger/10"
            >
              Sign out
            </Button>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

function RowLink({
  to,
  icon: Icon,
  label,
  hint,
  disabled,
  accent,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  disabled?: boolean;
  accent?: boolean;
}) {
  if (disabled) {
    return (
      <Card className="opacity-50">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-surface-sunken text-fg-subtle">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">{label}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Link to={to} className="block">
      <Card className="transition-colors hover:bg-surface-sunken">
        <div className="flex items-center gap-3 px-5 py-4">
          <div
            className={
              accent
                ? "flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary"
                : "flex size-9 items-center justify-center rounded-xl bg-surface-sunken text-fg-muted"
            }
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">{label}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>
          </div>
          <ChevronRight className="size-4 text-fg-subtle" />
        </div>
      </Card>
    </Link>
  );
}
