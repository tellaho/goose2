import { useState, useCallback, useRef, useEffect } from "react";

interface UseFileImportOptions {
  accept?: string;
  onFilesSelected: (files: { data: number[]; filename: string }[]) => void;
}

export function useFileImport({
  accept,
  onFilesSelected,
}: UseFileImportOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const callbackRef = useRef(onFilesSelected);
  callbackRef.current = onFilesSelected;

  const readFile = useCallback(
    async (file: File): Promise<{ data: number[]; filename: string }> => {
      const buffer = await file.arrayBuffer();
      return {
        data: Array.from(new Uint8Array(buffer)),
        filename: file.name,
      };
    },
    [],
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const results = await Promise.all(files.map(readFile));
      callbackRef.current(results);
    },
    [readFile],
  );

  // Clean up the hidden input element on unmount
  useEffect(() => {
    return () => {
      if (inputRef.current) {
        inputRef.current.remove();
        inputRef.current = null;
      }
    };
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const openFilePicker = useCallback(() => {
    if (!inputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      if (accept) input.accept = accept;
      input.style.display = "none";
      input.addEventListener("change", () => {
        if (input.files && input.files.length > 0) {
          handleFiles(input.files);
        }
        input.value = "";
      });
      document.body.appendChild(input);
      inputRef.current = input;
    }
    inputRef.current.click();
  }, [accept, handleFiles]);

  return {
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    openFilePicker,
  };
}
