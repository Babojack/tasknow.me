import { demoApi } from "@/api/demoClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function BlogPage() {
  const navigate = useNavigate();
  const { language, t } = useTranslation();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts", language],
    queryFn: async () => {
      const allPosts = await demoApi.entities.BlogPost.filter(
        {
          status: "published",
          language: language,
        },
        "-published_at"
      );
      return allPosts;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-black tracking-tighter mb-4">BLOG</h1>
          <p className="text-xl text-gray-600 font-bold">News, tips and updates</p>
        </div>

        {posts.length === 0 ? (
          <div className="border-4 border-black bg-white p-16 text-center">
            <p className="text-2xl font-black text-gray-600 mb-2">{t("noArticlesYet")}</p>
            <p className="text-gray-500 font-bold">New content coming soon!</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]] transition-all cursor-pointer"
                onClick={() => navigate(createPageUrl("BlogPost") + `?slug=${post.slug}`)}
              >
                <CardHeader className="border-b-4 border-black p-0">
                  {post.cover_image_url && (
                    <img 
                      src={post.cover_image_url} 
                      alt={post.title} 
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-600">
                        {format(new Date(post.published_at), "dd MMMM yyyy")}
                      </span>
                      {post.views_count > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-bold text-gray-600">{post.views_count}</span>
                        </>
                      )}
                    </div>
                    <CardTitle className="font-black text-2xl mb-3 line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <p className="text-gray-600 font-medium line-clamp-3 mb-4">
                      {post.excerpt || post.content.substring(0, 150)}
                    </p>
                    <Button className="w-full bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black h-12">
                      WEITERLESEN
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}