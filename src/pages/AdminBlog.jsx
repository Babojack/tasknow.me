import { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function AdminBlogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    cover_image_url: "",
    language: "de",
    status: "draft",
    meta_title: "",
    meta_description: "",
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
    retry: false,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => demoApi.entities.BlogPost.list("-created_date"),
    enabled: !!user && user.role === "admin",
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => demoApi.entities.BlogPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => demoApi.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => demoApi.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      cover_image_url: "",
      language: "de",
      status: "draft",
      meta_title: "",
      meta_description: "",
    });
    setEditingPost(null);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      cover_image_url: post.cover_image_url || "",
      language: post.language,
      status: post.status,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
    });
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t("deletePostConfirm"))) {
      deletePostMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    const postData = {
      ...formData,
      author_id: user.id,
      published_at: formData.status === "published" ? new Date().toISOString() : null,
    };

    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data: postData });
    } else {
      createPostMutation.mutate(postData);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await demoApi.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, cover_image_url: file_url });
    } finally {
      setUploading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <Card className="border-4 border-black max-w-md">
          <CardContent className="p-8 text-center">
            <p className="font-black text-xl mb-4">ZUGRIFF VERWEIGERT</p>
            <p className="text-gray-600 font-bold">{t("adminOnly")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("CustomerTasks"))}
              className="w-12 h-12 border-4 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-black tracking-tighter">BLOG VERWALTUNG</h1>
              <p className="text-gray-600 font-bold">{posts.length} Artikel</p>
            </div>
          </div>

          <Button
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black h-14 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            NEUER ARTIKEL
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]] transition-all">
                <CardHeader className="border-b-4 border-black p-0">
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="font-black text-lg line-clamp-2 flex-1">{post.title}</CardTitle>
                      <Badge className={post.status === "published" ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                        {post.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 font-bold">/{post.slug}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 font-medium">{post.excerpt || post.content.substring(0, 100)}</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(createPageUrl("BlogPost") + `?slug=${post.slug}`, "_blank")} 
                      className="flex-1 border-2 border-black font-black"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      ANSEHEN
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(post)}
                      className="border-2 border-black"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(post.id)} 
                      className="text-red-600 border-2 border-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-4 border-black">
            <DialogHeader>
              <DialogTitle className="font-black text-3xl tracking-tighter">
                {editingPost ? "ARTIKEL BEARBEITEN" : "NEUER ARTIKEL"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-black text-sm mb-2 block">TITEL *</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })} 
                    className="border-2 border-black h-12 font-bold"
                    placeholder="Artikel Titel..."
                  />
                </div>

                <div>
                  <Label className="font-black text-sm mb-2 block">URL-SLUG *</Label>
                  <Input 
                    value={formData.slug} 
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                    className="border-2 border-black h-12 font-mono"
                    placeholder="artikel-url-slug"
                  />
                </div>
              </div>

              <div>
                <Label className="font-black text-sm mb-2 block">COVER BILD</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploading} 
                  className="border-2 border-black h-12"
                />
                {formData.cover_image_url && (
                  <img src={formData.cover_image_url} alt="Cover" className="w-full h-64 object-cover mt-4 border-4 border-black" />
                )}
              </div>

              <div>
                <Label className="font-black text-sm mb-2 block">KURZBESCHREIBUNG</Label>
                <Textarea 
                  value={formData.excerpt} 
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
                  className="border-2 border-black font-medium"
                  rows={3}
                  placeholder={t("articleSummary")}
                />
              </div>

              <div>
                <Label className="font-black text-sm mb-2 block">INHALT *</Label>
                <div className="border-4 border-black">
                  <ReactQuill 
                    value={formData.content} 
                    onChange={(content) => setFormData({ ...formData, content })}
                    className="bg-white"
                    theme="snow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-black text-sm mb-2 block">SPRACHE</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                    <SelectTrigger className="border-2 border-black h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black">
                      <SelectItem value="de" className="font-bold">🇩🇪 Deutsch</SelectItem>
                      <SelectItem value="en" className="font-bold">🇬🇧 English</SelectItem>
                      <SelectItem value="en" className="font-bold">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-black text-sm mb-2 block">STATUS</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="border-2 border-black h-12 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black">
                      <SelectItem value="draft" className="font-bold">📝 {t("draft")}</SelectItem>
                      <SelectItem value="published" className="font-bold">✅ {t("published")}</SelectItem>
                      <SelectItem value="archived" className="font-bold">📦 Archiviert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-4 border-black bg-gray-50 p-4 space-y-4">
                <h3 className="font-black text-lg tracking-tighter">SEO EINSTELLUNGEN</h3>
                
                <div>
                  <Label className="font-black text-sm mb-2 block">META TITEL</Label>
                  <Input 
                    value={formData.meta_title} 
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} 
                    className="border-2 border-black h-12 font-medium"
                    placeholder={t("seoTitle")}
                  />
                </div>

                <div>
                  <Label className="font-black text-sm mb-2 block">META BESCHREIBUNG</Label>
                  <Textarea 
                    value={formData.meta_description} 
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} 
                    className="border-2 border-black font-medium"
                    rows={3}
                    placeholder={t("seoDescription")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                className="border-2 border-black font-black h-12 px-6"
              >
                ABBRECHEN
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createPostMutation.isPending || updatePostMutation.isPending || !formData.title || !formData.content} 
                className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black h-12 px-8"
              >
                {createPostMutation.isPending || updatePostMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {editingPost ? t("update").toUpperCase() : t("publish").toUpperCase()}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}