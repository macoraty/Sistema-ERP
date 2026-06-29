export const triggerPrint = (title: string = 'Documento', templateHtml?: string) => {
  let htmlContent = '';

  if (templateHtml) {
    htmlContent = templateHtml;
  } else {
    const element = document.querySelector('.print-section');
    if (!element) {
      window.print();
      return;
    }

    // Clone the element to manipulate it safely
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove elements that shouldn't be printed
    const hiddenElements = clone.querySelectorAll('.print-hide');
    hiddenElements.forEach(el => el.remove());

    htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { 
              background: white !important; 
              color: black !important; 
              padding: 40px;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            * {
              color: black !important;
              border-color: #d1d5db !important;
            }
            .text-white { color: black !important; }
            .bg-\\[\\#0f1523\\] { background: #f3f4f6 !important; }
            .bg-\\[\\#111827\\] { background: white !important; }
            .border-\\[\\#1f293d\\] { border-color: #e5e7eb !important; }
            .text-gray-300 { color: #374151 !important; }
            .text-gray-400 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          ${clone.innerHTML}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 800);
            };
          </script>
        </body>
      </html>
    `;
  }

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback if popup is blocked
    const originalTitle = document.title;
    document.title = title;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  }
};
