import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp } from "@/lib/auth";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) await signIn(username, password);
      else await signUp(username, password);
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Couldn't continue",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
      <div className="noise" aria-hidden="true" />
      <div className="bg-orb orb-1" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm px-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-bold text-foreground tracking-tight">Explyn<span className="text-muted-foreground">.</span></span>
        </button>

        <h1 className="text-2xl font-bold mb-1">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Accounts live on this device only — no email, no cloud, nothing leaves your browser.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            autoComplete="username"
            className="bg-card border-border rounded-lg"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="bg-card border-border rounded-lg"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-40">
            <User className="h-4 w-4 mr-2" />
            {loading ? "Working…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isLogin ? "First time here?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-foreground underline underline-offset-4">
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>

        <p className="text-[11px] text-muted-foreground text-center mt-8 leading-relaxed">
          Forgot your password? Since nothing is stored on a server, there is no reset — clear the
          app data in Settings and start again.
        </p>
      </div>
    </div>
  );
};

export default Auth;
