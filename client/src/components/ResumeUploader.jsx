import { useCallback, useEffect, useState } from "react";
import {
  FileArchive,
  FileImage,
  FileText,
  LoaderCircle,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { resumeApi } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eyebrow } from "@/components/ui/text-link";
import {
  cn,
  formatFileSize,
  getErrorDetailText,
  getErrorMessage,
} from "@/lib/utils";
import {
  MAX_FILE_SIZE,
  SUPPORTED_EXTENSIONS,
  truncateResumeName,
  validateFile,
} from "@/lib/validators";

const acceptMap = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

function FileIcon({ type }) {
  if (type === "image/png" || type === "image/jpeg")
    return <FileImage className="h-5 w-5" aria-hidden="true" />;
  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return <FileArchive className="h-5 w-5" aria-hidden="true" />;
  return <FileText className="h-5 w-5" aria-hidden="true" />;
}

export function ResumeUploader({
  onComplete,
  onReset: onParentReset,
  versionName = "",
  className,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("idle");

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = useCallback((acceptedFile) => {
    const validationError = validateFile(acceptedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError("");
    setFile(acceptedFile);
    setProgress(0);
    setStage("idle");
  }, []);

  const onDrop = useCallback(
    (acceptedFiles) => {
      selectFile(acceptedFiles?.[0]);
    },
    [selectFile],
  );

  const onDropRejected = useCallback((fileRejections) => {
    const rejection = fileRejections?.[0];
    const code = rejection?.errors?.[0]?.code;
    setError(
      code === "file-too-large"
        ? "The file must be smaller than 10 MB."
        : "That file type is not supported. Use PDF, DOCX, JPG, JPEG, or PNG.",
    );
    setFile(null);
  }, []);

  const { getRootProps, getInputProps, inputRef, isDragActive, open } =
    useDropzone({
      accept: acceptMap,
      maxSize: MAX_FILE_SIZE,
      multiple: false,
      noClick: true,
      noKeyboard: true,
      onDrop,
      onDropRejected,
    });

  const reset = () => {
    setFile(null);
    setError("");
    setUploading(false);
    setProgress(0);
    setStage("idle");
    if (inputRef.current) inputRef.current.value = "";
    onParentReset?.();
  };

  const upload = async () => {
    if (!file || uploading) return;
    setError("");
    setUploading(true);
    setStage("uploading");
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", truncateResumeName(versionName, file.name));
    try {
      const resume = await resumeApi.upload(formData, (event) => {
        const nextProgress = event.total
          ? Math.round((event.loaded / event.total) * 100)
          : 0;
        setProgress(nextProgress);
        if (nextProgress >= 100) setStage("queued");
      });
      const status = resume?.status;
      setProgress(100);
      setStage(status === "failed" ? "error" : "complete");
      if (status === "failed") {
        setError(resume?.message || "The server could not process this CV.");
        return;
      }
      await onComplete?.(resume, file);
    } catch (uploadError) {
      setStage("error");
      setError(
        [
          getErrorMessage(
            uploadError,
            "The CV could not be uploaded. Please try again.",
          ),
          getErrorDetailText(uploadError),
        ]
          .filter(Boolean)
          .join(" "),
      );
    } finally {
      setUploading(false);
    }
  };

  const stageCopy = {
    uploading: {
      title: "Uploading your CV",
      detail: "The file is on its way to your private workspace.",
    },
    queued: {
      title: "Upload complete · processing queued",
      detail:
        "The API is still processing this document. We will only show an analysis when the server returns one.",
    },
    complete: {
      title: "Upload received",
      detail: "Opening the analysis workspace now.",
    },
    error: {
      title: "Upload needs attention",
      detail: "Review the message below and try again.",
    },
  };
  const currentStage = stageCopy[stage];
  const isImage = file?.type?.startsWith("image/");

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border border-dashed p-6 text-center outline-none transition-colors duration-150 sm:p-10",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-hairline-strong bg-surface-soft hover:border-primary/50",
        )}
      >
        <input
          {...getInputProps()}
          ref={inputRef}
          type="file"
          tabIndex={-1}
          aria-label="file upload"
        />
        <div className="mx-auto grid h-12 w-12 place-items-center border border-hairline bg-canvas text-primary">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </div>
        <Eyebrow className="mt-6">PDF · DOCX · JPG · PNG</Eyebrow>
        <p className="mt-3 text-[20px] leading-[1.4] font-bold">
          {isDragActive ? "Drop your CV here" : "Drag and drop your CV"}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-[1.55] font-light text-muted">
          Upload one version at a time. Files up to 10 MB are supported.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={open}
        >
          <UploadCloud className="h-4 w-4" aria-hidden="true" /> Browse files
        </Button>
        <p className="mt-4 text-[12px] font-light text-muted">
          Your file is sent to your configured API only after you choose it.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>We couldn’t use that file</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {file && (
        <div className="border border-hairline bg-canvas p-4">
          <div className="flex items-center gap-4">
            <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden border border-hairline bg-surface-soft text-primary">
              {isImage && previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileIcon type={file.type} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink">
                {file.name}
              </p>
              <p className="mt-1 text-[13px] font-light text-muted">
                {formatFileSize(file.size)} ·{" "}
                {file.type ||
                  (SUPPORTED_EXTENSIONS.includes(
                    file.name.split(".").pop()?.toLowerCase(),
                  )
                    ? "Ready to upload"
                    : "Document")}
              </p>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={reset}
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="inline-flex items-center gap-2 font-bold text-ink">
                  <LoaderCircle
                    className="h-3.5 w-3.5 animate-spin text-primary"
                    aria-hidden="true"
                  />
                  {currentStage?.title || "Uploading"}
                </span>
                <span className="font-bold tabular-nums text-primary">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p
                className="text-[13px] leading-[1.55] font-light text-muted"
                aria-live="polite"
              >
                {currentStage?.detail}
              </p>
            </div>
          )}

          {stage === "complete" && (
            <div className="mt-4 border border-success/30 bg-success/5 px-3 py-2 text-[13px] text-success-foreground">
              <span className="font-bold">Upload received.</span> The server
              response is being used for the next step.
            </div>
          )}

          {!uploading && stage !== "complete" && (
            <Button type="button" className="mt-5 w-full" onClick={upload}>
              <UploadCloud className="h-4 w-4" aria-hidden="true" /> Upload and
              continue
            </Button>
          )}

          {stage === "error" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={reset}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Start
              over
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
