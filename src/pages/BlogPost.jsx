import React from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function BlogPostPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const posts = await demoApi.entities.BlogPost.filter({ slug, status: "published" });
      return posts[0];
    },
    enabled: !!slug,
  });

  const incrementViewsMutation = useMutation({
    mutationFn: async () => {
      if (post) {
        await demoApi.entities.BlogPost.update(post.id, {
          views_count: (post.views_count || 0) + 1,
        });
      }
    },
  });

  React.useEffect(() => {
    if (post && !incrementViewsMutation.isSuccess) {
      incrementViewsMutation.mutate();
    }
  }, [post]);

  React.useEffect(() => {
    if (post) {
      document.title = post.meta_title || post.title;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = post.meta_description || post.excerpt || post.content.substring(0, 160);
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="border-4 border-black p-16 text-center max-w-md">
          <p className="text-2xl font-black mb-4">Artikel nicht gefunden</p>
          <Button onClick={() => navigate(createPageUrl("Blog"))} className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black">
            {t("backToBlog")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Button
          onClick={() => navigate(createPageUrl("Blog"))}
          variant="outline"
          className="mb-8 border-4 border-black hover:bg-black hover:text-white font-black"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t("backToBlog")}
        </Button>

        {post.cover_image_url && (
          <img 
            src={post.cover_image_url} 
            alt={post.title}
            className="w-full h-96 object-cover border-4 border-black mb-8"
          />
        )}

        <h1 className="text-5xl font-black text-black tracking-tighter mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 mb-8 pb-8 border-b-4 border-black">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="font-bold">
              {format(new Date(post.published_at), "dd MMMM yyyy")}
            </span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-2 text-gray-600">
            <Eye className="w-5 h-5" />
            <span className="font-bold">{post.views_count || 0} Aufrufe</span>
          </div>
        </div>

        <div className="prose prose-lg max-w-none mb-12">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-4xl font-black mb-6 mt-8" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-3xl font-black mb-4 mt-6" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-2xl font-black mb-3 mt-5" {...props} />,
              p: ({node, ...props}) => <p className="text-lg leading-relaxed mb-4 font-medium" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
              li: ({node, ...props}) => <li className="text-lg font-medium" {...props} />,
              a: ({node, ...props}) => <a className="text-[#E45826] font-bold underline hover:no-underline" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-black pl-4 italic my-6" {...props} />,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="border-t-4 border-black pt-8">
          <Button
            onClick={() => navigate(createPageUrl("Blog"))}
            className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black h-14 px-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("backToBlog")}
          </Button>
        </div>
      </div>
    </div>
  );
}