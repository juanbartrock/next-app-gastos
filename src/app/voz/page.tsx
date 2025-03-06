"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Mic, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VozPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "uploading" | "transcribing" | "analyzing" | "completed" | "error"
  >("idle");

  // Redireccionar si no está autenticado
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Función para manejar la carga de archivos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAudioFile(files[0]);
      setTranscription("");
      setProcessingStatus("idle");
    }
  };

  // Función para procesar el archivo de audio
  const processAudio = async () => {
    if (!audioFile) {
      toast.error("Por favor, selecciona un archivo de audio primero");
      return;
    }

    try {
      setLoading(true);
      setProcessingStatus("uploading");

      // 1. Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append("audio", audioFile);

      // 2. Enviar el archivo para ser procesado
      setProcessingStatus("transcribing");
      const response = await fetch("/api/voz/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al procesar el audio");
      }

      const data = await response.json();
      setTranscription(data.text);
      
      // 3. Analizar la transcripción para extraer entidades
      setProcessingStatus("analyzing");
      const analysisResponse = await fetch("/api/voz/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: data.text }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Error al analizar la transcripción");
      }

      const analysisData = await analysisResponse.json();
      
      // 4. Crear el gasto basado en el análisis
      const createGastoResponse = await fetch("/api/gastos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysisData.gastoData),
      });

      if (!createGastoResponse.ok) {
        throw new Error("Error al crear el gasto");
      }

      setProcessingStatus("completed");
      toast.success("¡Gasto registrado con éxito!");

      // Opcional: redireccionar a la página principal después de un tiempo
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setProcessingStatus("error");
      toast.error("Ocurrió un error al procesar el audio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="h-8 w-8"
              >
                <ArrowLeft size={18} />
              </Button>
              <CardTitle className="text-xl text-center flex-1 mr-8">
                Registro de Gasto por Voz
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-6">
                  <Mic className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Sube un archivo de audio que describa tu gasto y procesaremos la información automáticamente.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                {audioFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAudioFile(null)}
                      className="mt-2"
                    >
                      Cambiar archivo
                    </Button>
                  </div>
                ) : (
                  <>
                    <label
                      htmlFor="audio-upload"
                      className="flex flex-col items-center gap-3 cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium">
                        Haz clic para seleccionar un archivo
                      </span>
                      <span className="text-xs text-gray-500">
                        MP3, WAV, M4A (max. 10MB)
                      </span>
                    </label>
                    <input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {transcription && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Transcripción:</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transcription}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  className="w-full"
                  disabled={!audioFile || loading}
                  onClick={processAudio}
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {processingStatus === "idle" && "Procesar Audio"}
                  {processingStatus === "uploading" && "Subiendo audio..."}
                  {processingStatus === "transcribing" && "Transcribiendo..."}
                  {processingStatus === "analyzing" && "Analizando entidades..."}
                  {processingStatus === "completed" && "¡Gasto registrado!"}
                  {processingStatus === "error" && "Reintentar"}
                </Button>
                {processingStatus !== "idle" && processingStatus !== "completed" && processingStatus !== "error" && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: 
                          processingStatus === "uploading" ? "25%" :
                          processingStatus === "transcribing" ? "50%" :
                          processingStatus === "analyzing" ? "75%" : "100%",
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 