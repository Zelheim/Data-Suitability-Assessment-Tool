// Minimal DOCX generator without external libraries
// Creates a valid DOCX file by manually constructing the ZIP archive and XML content

(function() {
  // CRC32 calculation for ZIP format
  function crc32(data) {
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[i] = c;
    }

    let crc = -1;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  // Convert string to byte array
  function stringToBytes(str) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xFF;
    }
    return bytes;
  }

  // Create ZIP file structure
  function createZip(files) {
    const centralDirectory = [];
    const fileData = [];
    let offset = 0;

    // Process each file
    files.forEach(file => {
      const content = new TextEncoder().encode(file.content);
      const crc = crc32(file.content);
      const fileName = stringToBytes(file.name);

      // Local file header
      const localHeader = new Uint8Array(30 + fileName.length);
      const view = new DataView(localHeader.buffer);

      view.setUint32(0, 0x04034b50, true); // Signature
      view.setUint16(4, 20, true); // Version needed
      view.setUint16(6, 0, true); // Flags
      view.setUint16(8, 0, true); // Compression method (0 = no compression)
      view.setUint16(10, 0, true); // File time
      view.setUint16(12, 0, true); // File date
      view.setUint32(14, crc, true); // CRC32
      view.setUint32(18, content.length, true); // Compressed size
      view.setUint32(22, content.length, true); // Uncompressed size
      view.setUint16(26, fileName.length, true); // File name length
      view.setUint16(28, 0, true); // Extra field length

      localHeader.set(fileName, 30);

      // Store file data
      fileData.push(localHeader);
      fileData.push(content);

      // Central directory entry
      const centralHeader = new Uint8Array(46 + fileName.length);
      const centralView = new DataView(centralHeader.buffer);

      centralView.setUint32(0, 0x02014b50, true); // Signature
      centralView.setUint16(4, 20, true); // Version made by
      centralView.setUint16(6, 20, true); // Version needed
      centralView.setUint16(8, 0, true); // Flags
      centralView.setUint16(10, 0, true); // Compression method
      centralView.setUint16(12, 0, true); // File time
      centralView.setUint16(14, 0, true); // File date
      centralView.setUint32(16, crc, true); // CRC32
      centralView.setUint32(20, content.length, true); // Compressed size
      centralView.setUint32(24, content.length, true); // Uncompressed size
      centralView.setUint16(28, fileName.length, true); // File name length
      centralView.setUint16(30, 0, true); // Extra field length
      centralView.setUint16(32, 0, true); // File comment length
      centralView.setUint16(34, 0, true); // Disk number
      centralView.setUint16(36, 0, true); // Internal attributes
      centralView.setUint32(38, 0, true); // External attributes
      centralView.setUint32(42, offset, true); // Relative offset

      centralHeader.set(fileName, 46);
      centralDirectory.push(centralHeader);

      offset += localHeader.length + content.length;
    });

    // Calculate central directory size
    let centralDirSize = 0;
    centralDirectory.forEach(cd => centralDirSize += cd.length);

    // End of central directory record
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);

    endView.setUint32(0, 0x06054b50, true); // Signature
    endView.setUint16(4, 0, true); // Disk number
    endView.setUint16(6, 0, true); // Disk with central directory
    endView.setUint16(8, files.length, true); // Entries on this disk
    endView.setUint16(10, files.length, true); // Total entries
    endView.setUint32(12, centralDirSize, true); // Central directory size
    endView.setUint32(16, offset, true); // Central directory offset
    endView.setUint16(20, 0, true); // Comment length

    // Combine all parts
    const totalSize = offset + centralDirSize + endRecord.length;
    const zipData = new Uint8Array(totalSize);
    let pos = 0;

    fileData.forEach(data => {
      zipData.set(data, pos);
      pos += data.length;
    });

    centralDirectory.forEach(cd => {
      zipData.set(cd, pos);
      pos += cd.length;
    });

    zipData.set(endRecord, pos);

    return zipData;
  }

  // Escape XML special characters
  function escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Create a table row
  function createTableRow(cells, isHeader = false) {
    let row = '<w:tr>';
    cells.forEach(cell => {
      const cellText = escapeXml(cell.text || '');
      const bgColor = cell.bgColor || 'FFFFFF';
      const bold = isHeader || cell.bold ? '<w:b/>' : '';
      const color = cell.color || '000000';

      row += `<w:tc>
        <w:tcPr>
          <w:shd w:fill="${bgColor}"/>
          <w:tcBorders>
            <w:top w:val="single" w:sz="4" w:color="CCCCCC"/>
            <w:left w:val="single" w:sz="4" w:color="CCCCCC"/>
            <w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/>
            <w:right w:val="single" w:sz="4" w:color="CCCCCC"/>
          </w:tcBorders>
        </w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr>
          <w:r>
            <w:rPr>${bold}<w:color w:val="${color}"/></w:rPr>
            <w:t xml:space="preserve">${cellText}</w:t>
          </w:r>
        </w:p>
      </w:tc>`;
    });
    row += '</w:tr>';
    return row;
  }

  // Create DOCX file with structured content
  window.createDocx = function(data) {
    let body = '';

    data.forEach(item => {
      switch (item.type) {
        case 'title':
          body += `<w:p>
            <w:pPr>
              <w:spacing w:before="240" w:after="120"/>
              <w:jc w:val="left"/>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="2E5090"/></w:rPr>
              <w:t>${escapeXml(item.text)}</w:t>
            </w:r>
          </w:p>`;
          break;

        case 'heading':
          body += `<w:p>
            <w:pPr>
              <w:spacing w:before="240" w:after="120"/>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="2E5090"/></w:rPr>
              <w:t>${escapeXml(item.text)}</w:t>
            </w:r>
          </w:p>`;
          break;

        case 'subheading':
          body += `<w:p>
            <w:pPr>
              <w:spacing w:before="200" w:after="100"/>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
              <w:t>${escapeXml(item.text)}</w:t>
            </w:r>
          </w:p>`;
          break;

        case 'alert':
          const textColor = item.style === 'success' ? '3C763D' : item.style === 'danger' ? 'A94442' : item.style === 'info' ? '31708F' : '000000';
          body += `<w:p>
            <w:pPr>
              <w:spacing w:before="120" w:after="120"/>
              <w:ind w:left="200" w:right="200"/>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:color w:val="${textColor}"/></w:rPr>
              <w:t>${escapeXml(item.text)}</w:t>
            </w:r>
          </w:p>`;
          break;

        case 'infoBox':
          body += `<w:p>
            <w:pPr>
              <w:spacing w:before="120" w:after="120"/>
              <w:ind w:left="200" w:right="200"/>
            </w:pPr>
            <w:r>
              <w:rPr><w:color w:val="31708F"/></w:rPr>
              <w:t xml:space="preserve">${escapeXml(item.text)}</w:t>
            </w:r>
          </w:p>`;
          break;

        case 'table':
          body += '<w:tbl>';
          body += `<w:tblPr>
            <w:tblW w:type="pct" w:w="5000"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:color="CCCCCC"/>
              <w:left w:val="single" w:sz="4" w:color="CCCCCC"/>
              <w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/>
              <w:right w:val="single" w:sz="4" w:color="CCCCCC"/>
              <w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/>
              <w:insideV w:val="single" w:sz="4" w:color="CCCCCC"/>
            </w:tblBorders>
          </w:tblPr>`;

          if (item.headers) {
            body += createTableRow(item.headers.map(h => ({ text: h, bgColor: 'E0E0E0' })), true);
          }

          item.rows.forEach(row => {
            body += createTableRow(row);
          });

          body += '</w:tbl>';
          body += '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>';
          break;

        case 'paragraph':
          body += `<w:p>
            <w:pPr><w:spacing w:after="100"/></w:pPr>
            <w:r>
              <w:rPr>${item.bold ? '<w:b/>' : ''}</w:rPr>
              <w:t xml:space="preserve">${escapeXml(item.text)}</w:t>
            </w:r>
          </w:p>`;
          break;

        case 'spacer':
          body += '<w:p><w:pPr><w:spacing w:after="200"/></w:pPr></w:p>';
          break;

        default:
          body += `<w:p><w:r><w:t xml:space="preserve">${escapeXml(item.text || '')}</w:t></w:r></w:p>`;
      }
    });

    // Document.xml - main content
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${body}
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
</w:sectPr>
</w:body>
</w:document>`;

    // [Content_Types].xml
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    // _rels/.rels
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    // Create ZIP with all files
    const files = [
      { name: '[Content_Types].xml', content: contentTypes },
      { name: '_rels/.rels', content: rels },
      { name: 'word/document.xml', content: documentXml }
    ];

    const zipData = createZip(files);
    return new Blob([zipData], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  };
})();
