import React, { useEffect, useRef } from 'react';
import { InvoiceData, CURRENCIES } from '../types';
import * as d3 from 'd3';

interface InvoicePreviewProps {
  data: InvoiceData;
  id?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data, id }) => {
  const currencySymbol = CURRENCIES.find(c => c.code === data.currency)?.symbol || '$';
  
  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const taxAmount = (subtotal * data.taxRate) / 100;
  const total = subtotal + taxAmount;

  // D3 Stamp Ref
  const stampRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (stampRef.current) {
        const svg = d3.select(stampRef.current);
        svg.selectAll("*").remove();
        
        const width = 100;
        const height = 100;
        
        // Create a unique geometric stamp based on business name length
        const seed = data.senderName.length;
        const color = "#e2e8f0"; // Slate-200

        // Outer Circle
        svg.append("circle")
           .attr("cx", width/2)
           .attr("cy", height/2)
           .attr("r", 45)
           .attr("stroke", color)
           .attr("stroke-width", 2)
           .attr("fill", "none")
           .style("opacity", 0.5);
           
        // Inner Pattern (Rotated Squares)
        for(let i=0; i<4; i++) {
            svg.append("rect")
               .attr("x", width/2 - 30)
               .attr("y", height/2 - 30)
               .attr("width", 60)
               .attr("height", 60)
               .attr("stroke", color)
               .attr("stroke-width", 1)
               .attr("fill", "none")
               .attr("transform", `rotate(${i * (90/4) + seed}, ${width/2}, ${height/2})`)
               .style("opacity", 0.3);
        }

        svg.append("text")
           .attr("x", "50%")
           .attr("y", "50%")
           .attr("dy", ".3em")
           .attr("text-anchor", "middle")
           .style("font-size", "10px")
           .style("fill", "#94a3b8")
           .style("font-family", "monospace")
           .text("APPROVED");
    }
  }, [data.senderName]);


  return (
    <div 
      id={id} 
      className="bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 md:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] relative print-show flex flex-col justify-between"
      style={{ aspectRatio: '210/297' }}
    >
        {/* Header */}
        <div>
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-4 max-w-[50%]">
                    {data.logo && (
                        <div className="h-20 w-auto mb-2 overflow-hidden">
                             <img src={data.logo} alt="Business Logo" className="h-full max-w-[200px] w-auto object-contain object-left" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">INVOICE</h1>
                        <p className="text-slate-500 font-mono text-sm">#{data.invoiceNumber}</p>
                    </div>
                </div>
                <div className="text-right max-w-[45%]">
                    <h2 className="text-xl font-bold text-slate-700 break-words">{data.senderName}</h2>
                    <div className="text-slate-500 text-sm mt-1 space-y-0.5">
                        <p className="break-all">{data.senderEmail}</p>
                        <p className="whitespace-pre-wrap break-words">{data.senderAddress}</p>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="max-w-full overflow-hidden">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                    <div className="text-slate-700">
                        <p className="font-semibold text-lg break-words">{data.recipientName}</p>
                        <p className="text-sm break-all">{data.recipientEmail}</p>
                        <p className="text-sm whitespace-pre-wrap mt-1 break-words">{data.recipientAddress}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Issued</h3>
                        <p className="text-slate-700 font-medium">{data.date}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</h3>
                        <p className="text-slate-700 font-medium">{data.dueDate}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
                <table className="w-full">
                <thead>
                    <tr className="border-b-2 border-slate-100">
                    <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Qty</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Price</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Total</th>
                    </tr>
                </thead>
                <tbody className="text-slate-600 text-sm">
                    {data.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-4 pr-4 font-medium break-words max-w-[300px]">{item.description}</td>
                        <td className="py-4 text-right align-top">{item.quantity}</td>
                        <td className="py-4 text-right align-top">{currencySymbol}{item.price.toFixed(2)}</td>
                        <td className="py-4 text-right font-semibold text-slate-800 align-top">
                        {currencySymbol}{(item.quantity * item.price).toFixed(2)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 md:w-1/3 space-y-3">
                <div className="flex justify-between text-slate-500 text-sm">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                
                {data.taxType === 'cgst_sgst' ? (
                    <>
                        <div className="flex justify-between text-slate-500 text-sm">
                            <span>CGST ({data.taxRate / 2}%)</span>
                            <span>{currencySymbol}{(taxAmount / 2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-sm">
                            <span>SGST ({data.taxRate / 2}%)</span>
                            <span>{currencySymbol}{(taxAmount / 2).toFixed(2)}</span>
                        </div>
                    </>
                ) : data.taxType === 'igst' ? (
                    <div className="flex justify-between text-slate-500 text-sm">
                        <span>IGST ({data.taxRate}%)</span>
                        <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                    </div>
                ) : (
                    <div className="flex justify-between text-slate-500 text-sm">
                        <span>Tax ({data.taxRate}%)</span>
                        <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                    </div>
                )}

                <div className="flex justify-between text-slate-800 font-bold text-lg pt-3 border-t border-slate-200">
                    <span>Total</span>
                    <span>{currencySymbol}{total.toFixed(2)}</span>
                </div>
                </div>
            </div>
        </div>

      {/* Footer / Notes */}
      <div className="relative">
        <div className="absolute -top-24 -left-4 pointer-events-none">
             {/* D3 Stamp Container */}
             <svg ref={stampRef} width="100" height="100" className="opacity-80"></svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-slate-100 pt-8">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-slate-600 leading-relaxed break-words">{data.notes}</p>
            </div>
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                <p className="text-sm text-slate-600 leading-relaxed break-words">{data.terms}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;