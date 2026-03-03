import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Building2, User, Shield } from "lucide-react";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function AdminVerificationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
    retry: false,
  });

  const { data: verificationRequests = [], isLoading } = useQuery({
    queryKey: ["verification-requests"],
    queryFn: () => demoApi.entities.VerificationRequest.list("-created_date"),
    enabled: !!user && user.role === "admin",
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (request) => {
      await demoApi.entities.VerificationRequest.update(request.id, { 
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      });
      
      const users = await demoApi.entities.User.filter({ id: request.user_id });
      if (users[0]) {
        await demoApi.entities.User.update(request.user_id, { 
          verification_status: "approved", 
          is_verified: true 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (request) => {
      await demoApi.entities.VerificationRequest.update(request.id, { 
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      });
      
      const users = await demoApi.entities.User.filter({ id: request.user_id });
      if (users[0]) {
        await demoApi.entities.User.update(request.user_id, { 
          verification_status: "rejected",
          is_verified: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
    },
  });

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
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <p className="font-black text-2xl mb-2">ZUGRIFF VERWEIGERT</p>
            <p className="text-gray-600 font-bold">{t("adminOnly")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = verificationRequests.filter(r => r.status === "pending");
  const approvedRequests = verificationRequests.filter(r => r.status === "approved");
  const rejectedRequests = verificationRequests.filter(r => r.status === "rejected");

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
              <h1 className="text-4xl font-black text-black tracking-tighter">VERIFIZIERUNG</h1>
              <p className="text-gray-600 font-bold text-lg">{pendingRequests.length} ausstehende Anfragen</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black text-white px-6 py-3 border-4 border-black">
            <Shield className="w-6 h-6" />
            <div>
              <p className="text-xs font-bold">ADMIN BEREICH</p>
              <p className="text-sm font-black">{user.full_name}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="border-4 border-black mb-8 p-1 bg-white">
            <TabsTrigger value="pending" className="font-black text-sm data-[state=active]:bg-[#E45826] data-[state=active]:text-white">
              ⏳ AUSSTEHEND ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="font-black text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white">
              ✅ GENEHMIGT ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="font-black text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white">
              ❌ {t("rejected").toUpperCase()} ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card className="border-4 border-black">
                <CardContent className="p-16 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl font-black text-gray-600">{t("noPendingRequests")}</p>
                  <p className="text-gray-500 font-bold mt-2">{t("allVerificationsProcessed")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]] transition-all">
                    <CardHeader className="border-b-4 border-black p-4 bg-[#E45826] text-white">
                      <div className="flex items-center gap-3">
                        {request.user_type === "executor" && <User className="w-6 h-6" />}
                        {request.user_type === "customer" && <User className="w-6 h-6" />}
                        {request.user_type === "organization" && <Building2 className="w-6 h-6" />}
                        <div className="flex-1">
                          <CardTitle className="font-black text-lg">
                            {request.user_type === "executor" && "AUFTRAGNEHMER"}
                            {request.user_type === "customer" && "AUFTRAGGEBER"}
                            {request.user_type === "organization" && "ORGANISATION"}
                          </CardTitle>
                          <p className="text-xs font-mono opacity-80">ID: {request.user_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {request.document_front_url && (
                        <div>
                          <p className="text-xs font-black mb-2 tracking-wider">📄 AUSWEIS VORDERSEITE</p>
                          <img 
                            src={request.document_front_url} 
                            alt="ID Front" 
                            className="w-full h-40 object-cover border-4 border-black cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(request.document_front_url, "_blank")}
                          />
                        </div>
                      )}

                      {request.document_back_url && (
                        <div>
                          <p className="text-xs font-black mb-2 tracking-wider">📄 {t("idBackSide")}</p>
                          <img 
                            src={request.document_back_url} 
                            alt="ID Back" 
                            className="w-full h-40 object-cover border-4 border-black cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(request.document_back_url, "_blank")}
                          />
                        </div>
                      )}

                      {request.work_permit_url && (
                        <div>
                          <p className="text-xs font-black mb-2 tracking-wider">📄 ARBEITSGENEHMIGUNG (NON-EU)</p>
                          <img 
                            src={request.work_permit_url} 
                            alt="Work Permit" 
                            className="w-full h-40 object-cover border-4 border-black cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(request.work_permit_url, "_blank")}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t-4 border-black">
                        <Button
                          onClick={() => approveRequestMutation.mutate(request)}
                          disabled={approveRequestMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white border-2 border-black font-black h-12"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          GENEHMIGEN
                        </Button>
                        <Button
                          onClick={() => rejectRequestMutation.mutate(request)}
                          disabled={rejectRequestMutation.isPending}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white border-2 border-black font-black h-12"
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          ABLEHNEN
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {approvedRequests.map((request) => (
                <Card key={request.id} className="border-4 border-black">
                  <CardHeader className="border-b-2 border-black p-4 bg-green-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-black text-base">
                        {request.user_type === "executor" && "AUFTRAGNEHMER"}
                        {request.user_type === "customer" && "AUFTRAGGEBER"}
                        {request.user_type === "organization" && "ORGANISATION"}
                      </CardTitle>
                      <Badge className="bg-green-600 text-white">✓</Badge>
                    </div>
                    <p className="text-xs text-gray-600 font-mono">ID: {request.user_id.substring(0, 8)}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {rejectedRequests.map((request) => (
                <Card key={request.id} className="border-4 border-black">
                  <CardHeader className="border-b-2 border-black p-4 bg-red-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-black text-base">
                        {request.user_type === "executor" && "AUFTRAGNEHMER"}
                        {request.user_type === "customer" && "AUFTRAGGEBER"}
                        {request.user_type === "organization" && "ORGANISATION"}
                      </CardTitle>
                      <Badge className="bg-red-600 text-white">✗</Badge>
                    </div>
                    <p className="text-xs text-gray-600 font-mono">ID: {request.user_id.substring(0, 8)}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}