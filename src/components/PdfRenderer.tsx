'use client'

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useResizeDetector } from 'react-resize-detector';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { useForm } from 'react-hook-form';
import { ChevronUp, ChevronDown, RotateCw, Search } from 'lucide-react'; // Adjust icons as needed
import { Button } from './ui/button'; // Ensure this path is correct for your Button component
import { Input } from './ui/input'; // Ensure this path is correct for your Input component
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'; // Ensure these paths are correct

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfRenderer = ({ url }) => {
  const [numPages, setNumPages] = useState(null);
  const [currPage, setCurrPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const { ref, width } = useResizeDetector();
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: { pageNumber: "1" } });
  
  useEffect(() => {
    if (width && pageWidth) {
      const newScale = width / pageWidth;
      setScale(newScale);
    }
  }, [width, pageWidth]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page) => {
    setPageWidth(page.originalWidth);
  };

  const goToPage = (pageNumber) => {
    const page = Math.min(Math.max(pageNumber, 1), numPages);
    setCurrPage(page);
    setValue("pageNumber", String(page)); // Ensure input value is updated when changing pages
  };

  const handlePageChange = (data) => {
    goToPage(Number(data.pageNumber));
  };

  watch("pageNumber"); // Ensures input reflects current page after manual change

  const controlBarStyle = {
    backgroundColor: 'var(--background)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
    borderWidth: '2px', // Example of making the border 2x thicker
  };

  const buttonStyle = {
    color: 'var(--primary-foreground)', // Example of using a custom property for button text color
  };

  const inputStyle = {
    backgroundColor: 'var(--input)',
    color: 'var(--input-foreground)',
  };

  return (
    <div className='pdf-renderer'>
      <div className='controls flex justify-between items-center p-2 rounded-md shadow' style={controlBarStyle}>
        <Button style={buttonStyle} onClick={() => goToPage(currPage - 1)} disabled={currPage === 1} aria-label='Previous page'>
          <ChevronUp className='h-4 w-4' /> {/* Icons reversed as requested */}
        </Button>
        <form onSubmit={handleSubmit(handlePageChange)} className='flex items-center'>
          <Input {...register("pageNumber", { valueAsNumber: true })} type="number" className='w-16 text-center' />
          <span className='ml-2 text-sm'>/ {numPages}</span>
        </form>
        <Button onClick={() => goToPage(currPage + 1)} disabled={currPage === numPages} aria-label='Next page'>
          <ChevronDown className='h-4 w-4' /> {/* Icons reversed as requested */}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label='Zoom' className='flex items-center'>
              <Search className='h-4 w-4 mr-1' />
              Zoom
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setScale(scale >= 1 ? scale + 0.5 : 1)}>Zoom In</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setScale(scale > 1 ? scale - 0.5 : 1)}>Zoom Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => setRotation(rotation + 90)} aria-label='Rotate 90 degrees'>
          <RotateCw className='h-4 w-4' />
        </Button>
      </div>
      <SimpleBar autoHide={false} style={{ maxHeight: 'calc(100vh - 10rem)', width: '100%' }}>
        <div ref={ref} className='flex justify-center'>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            className='text-center' // Example of adding a class to the Document component
          >
            <Page pageNumber={currPage} scale={scale} rotate={rotation} onLoadSuccess={onPageLoadSuccess} />
          </Document>
        </div>
      </SimpleBar>
    </div>
  );
  // return (
  //   <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
  //     <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
  //       <Page pageNumber={currPage} scale={scale} rotate={rotation} />
  //     </Document>
  //   </div>
  // );
};

export default PdfRenderer;

