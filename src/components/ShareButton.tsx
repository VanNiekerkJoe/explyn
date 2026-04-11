import { useState } from "react";
import { Share2, Check, Link, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  snippetId: string;
  isPublic?: boolean;
  shareSlug?: string | null;
}

const ShareButton = ({ snippetId, isPublic: initialPublic, shareSlug: initialSlug }: ShareButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState(initialSlug);
  const [isPublic, setIsPublic] = useState(initialPublic || false);

  const generateSlug = () => {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  };

  const handleShare = async () => {
    if (isPublic && slug) {
      const url = `${window.location.origin}/share/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!" });
      return;
    }

    setLoading(true);
    const newSlug = generateSlug();
    const { error } = await supabase
      .from("snippets")
      .update({ is_public: true, share_slug: newSlug })
      .eq("id", snippetId);

    if (error) {
      toast({ title: "Error sharing", description: error.message, variant: "destructive" });
    } else {
      setSlug(newSlug);
      setIsPublic(true);
      const url = `${window.location.origin}/share/${newSlug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Public link created & copied!" });
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="btn-ghost text-sm gap-2 disabled:opacity-40"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4" />
      ) : isPublic ? (
        <Link className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {copied ? "Copied!" : isPublic ? "Copy link" : "Share"}
    </button>
  );
};

export default ShareButton;
