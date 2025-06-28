import React, { useState, useRef, useEffect } from 'react';
import { Printer, Download } from 'lucide-react';

const FactureGenerator = () => {
  // État pour stocker les informations de la facture
  const [factureNumber, setFactureNumber] = useState('');
  const [fournisseur, setFournisseur] = useState({
    name: '',
    address: '',
    city: '',
    siret: '',
    autoEntrepreneurName: '',
    iban: ''
  });
  const [client, setClient] = useState({
    name: '',
    address: '',
    city: '',
    siret:''
  });
  const [dateEcheance, setDateEcheance] = useState('');
  const [montantRegle, setMontantRegle] = useState(0); // Nouveau champ pour le montant déjà réglé
  const [items, setItems] = useState([{ id: 1, description: '', quantity: 0, price: 0, amount: 0 }]);
  const [total, setTotal] = useState(0);

  // Références pour l'impression
  const factureRef = useRef(null);

  // Fonction pour générer le numéro de facture basé sur la date
  const generateFactureNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateKey = `${year}${month}${day}`;
    
    // Récupérer le compteur pour aujourd'hui depuis le localStorage
    const todayCounters = JSON.parse(localStorage.getItem('factureCounters') || '{}');
    const todayCount = todayCounters[dateKey] || 0;
    
    // Incrémenter le compteur
    const newCount = todayCount + 1;
    todayCounters[dateKey] = newCount;
    localStorage.setItem('factureCounters', JSON.stringify(todayCounters));
    
    // Générer le numéro de facture : AAAA + MM + JJ + NN (numéro séquentiel)
    const factureNum = `${year}${month}${day}${String(newCount).padStart(2, '0')}`;
    
    return factureNum;
  };

  // Charger le numéro de facture au chargement du composant
  useEffect(() => {
    const newFactureNumber = generateFactureNumber();
    setFactureNumber(newFactureNumber);
  }, []);

  // Fonction pour formatter la date actuelle
  const getCurrentDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fonction pour ajouter une ligne d'article
  const addItem = () => {
    const newItem = {
      id: items.length + 1,
      description: '',
      quantity: 0,
      price: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  // Fonction pour mettre à jour un article
  const updateItem = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculer le montant si la quantité ou le prix change
        if (field === 'quantity' || field === 'price') {
          const quantity = field === 'quantity' ? value : item.quantity;
          const price = field === 'price' ? value : item.price;
          updatedItem.amount = quantity * price;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setItems(updatedItems);
    
    // Recalculer le total
    const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    setTotal(newTotal);
  };

  // Fonction pour supprimer un article
  const removeItem = (id) => {
    if (items.length > 1) {
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);
      
      // Recalculer le total
      const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      setTotal(newTotal);
    }
  };

  // Fonction pour générer le nom du fichier PDF avec la date du jour
  const generateFileName = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `facture_${year}${month}${day}.pdf`;
  };

  // Fonction pour générer et télécharger le PDF
  const generatePDF = () => {
    const element = factureRef.current;
    if (!element) return;

    // Créer un élément temporaire pour la capture
    const tempDiv = document.createElement('div');
    tempDiv.className = 'pdf-container';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // Format A4
    tempDiv.style.padding = '10mm';
    
    // Copier le contenu de la facture
    tempDiv.innerHTML = element.innerHTML;
    
    // Ajuster quelques styles pour le PDF
    const styles = document.createElement('style');
    styles.textContent = `
      .pdf-container * {
        font-family: Arial, sans-serif;
      }
      .pdf-container table {
        width: 100%;
        border-collapse: collapse;
      }
      .pdf-container th, .pdf-container td {
        border: 1px solid #ddd;
        padding: 8px;
      }
      .print\\:hidden { display: none; }
      .print\\:border-none { border: none; }
      .print\\:shadow-none { box-shadow: none; }
    `;
    
    tempDiv.appendChild(styles);
    document.body.appendChild(tempDiv);
    
    // Utiliser html2canvas pour capturer l'élément en image
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(tempDiv, { scale: 2 }).then(canvas => {
        // Utiliser jsPDF pour créer un PDF
        import('jspdf').then(({ default: jsPDF }) => {
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          // Ajouter l'image de la facture au PDF
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 190; // Largeur de la page A4 moins les marges
          const imgHeight = canvas.height * imgWidth / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          
          // Télécharger le PDF
          const fileName = generateFileName();
          pdf.save(fileName);
          
          // Nettoyer
          document.body.removeChild(tempDiv);
        });
      });
    });
  };

  // Calculer le montant net à payer
  const netAPayer = total - montantRegle;

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      <div className="p-4 bg-white shadow-md mb-4">
        <h1 className="text-2xl font-bold mb-4">Générateur de Factures</h1>
        
        {/* Section Fournisseur */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Informations Fournisseur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={fournisseur.name}
                onChange={(e) => setFournisseur({...fournisseur, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={fournisseur.address}
                onChange={(e) => setFournisseur({...fournisseur, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville et Code Postal</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={fournisseur.city}
                onChange={(e) => setFournisseur({...fournisseur, city: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={fournisseur.siret}
                onChange={(e) => setFournisseur({...fournisseur, siret: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'auto-entrepreneur</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={fournisseur.autoEntrepreneurName}
                onChange={(e) => setFournisseur({...fournisseur, autoEntrepreneurName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={fournisseur.iban}
                onChange={(e) => setFournisseur({...fournisseur, iban: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        {/* Section Client */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Informations Client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={client.name}
                onChange={(e) => setClient({...client, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={client.address}
                onChange={(e) => setClient({...client, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville et Code Postal</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={client.city}
                onChange={(e) => setClient({...client, city: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={client.siret}
                onChange={(e) => setClient({...client, siret: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Section Articles */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Articles</h2>
            <button 
              onClick={addItem}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + Ajouter une ligne
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Réf.</th>
                  <th className="py-2 px-4 border-b text-left">Description</th>
                  <th className="py-2 px-4 border-b text-center">Qté</th>
                  <th className="py-2 px-4 border-b text-right">Prix unit.</th>
                  <th className="py-2 px-4 border-b text-right">Montant</th>
                  <th className="py-2 px-4 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-4 border-b">{String(item.id).padStart(3, '0')}</td>
                    <td className="py-2 px-4 border-b">
                      <input
                        type="text"
                        className="w-full p-1 border border-gray-300 rounded"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-4 border-b">
                      <input
                        type="number"
                        className="w-16 p-1 border border-gray-300 rounded text-center"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 p-1 border border-gray-300 rounded text-right"
                          value={item.price || ''}
                          onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                        />
                        <span className="ml-1">€</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b text-right">{item.amount.toFixed(2)} €</td>
                    <td className="py-2 px-4 border-b text-center">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        disabled={items.length === 1}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan="4" className="py-2 px-4 text-right font-bold">Total :</td>
                  <td className="py-2 px-4 text-right font-bold">{total.toFixed(2)} €</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan="4" className="py-2 px-4 text-right font-bold">Total TTC :</td>
                  <td className="py-2 px-4 text-right font-bold">{total.toFixed(2)} €</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan="4" className="py-2 px-4 text-right font-bold">
                    <div className="flex items-center justify-end">
                      <span className="mr-2">Déjà réglé :</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 p-1 border border-gray-300 rounded text-right"
                        value={montantRegle}
                        onChange={(e) => setMontantRegle(Number(e.target.value))}
                      />
                      <span className="ml-1">€</span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right font-bold">{parseFloat(montantRegle).toFixed(2)} €</td>
                  <td></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan="4" className="py-2 px-4 text-right font-bold">NET à payer :</td>
                  <td className="py-2 px-4 text-right font-bold">{netAPayer.toFixed(2)} €</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Printer className="w-5 h-5 mr-2" />
            Imprimer
          </button>
          <button 
            onClick={generatePDF}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Download className="w-5 h-5 mr-2" />
            Générer PDF
          </button>
        </div>
      </div>
      
      {/* Aperçu de la Facture */}
      <div ref={factureRef} className="p-6 bg-white shadow-md print:shadow-none">
        <h2 className="text-lg font-semibold mb-4 print:hidden">Aperçu de la Facture</h2>
        
        <div className="border border-gray-300 p-6 print:border-none">
          <div className="flex justify-between mb-8">
            <div>
              <p className="font-bold">Micro-entreprise : {fournisseur.name}</p>
              <p>{fournisseur.address}</p>
              <p>{fournisseur.city}</p>
              <p>FRANCE</p>
              <p>SIRET : {fournisseur.siret}</p>
              {/* <p>Page : 1/1</p> */}
              <p>Numéro de facture : {factureNumber ? `${factureNumber.slice(0, 4)}-${factureNumber.slice(4, 6)}-${factureNumber.slice(6, 8)}-${factureNumber.slice(8)}` : ''}</p>
            </div>
            <div>
              <p className="font-bold">Client :</p>
              <p>{client.name}</p>
              <p>{client.address}</p>
              <p>{client.city}</p>
              <p>FRANCE</p>
              <p>SIRET : {client.siret}</p>
            </div>
          </div>
          
          {/* Section Auto-entrepreneur and IBAN */}
          <div className="mb-4">
            <p className="font-bold">Auto-entrepreneur : {fournisseur.autoEntrepreneurName}</p>
            <p>IBAN : {fournisseur.iban}</p>
          </div>

          <div className="mb-4">
            <p>Date de facturation : {getCurrentDate()}</p>
            <p>À régler avant : {dateEcheance ? new Date(dateEcheance).toLocaleDateString('fr-FR') : '05/04/2025'}</p>
          </div>
          
          <div className="mb-6">
            <p className="font-bold mb-2">Facture pour : {client.name}</p>
            
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border border-gray-300 text-left">Réf.</th>
                  <th className="py-2 px-4 border border-gray-300 text-left">Description</th>
                  <th className="py-2 px-4 border border-gray-300 text-center">Qté</th>
                  <th className="py-2 px-4 border border-gray-300 text-right">Prix unit.</th>
                  <th className="py-2 px-4 border border-gray-300 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-4 border border-gray-300">{String(item.id).padStart(3, '0')}</td>
                    <td className="py-2 px-4 border border-gray-300">{item.description}</td>
                    <td className="py-2 px-4 border border-gray-300 text-center">{item.quantity}</td>
                    <td className="py-2 px-4 border border-gray-300 text-right">{(item.price).toFixed(2)} €</td>
                    <td className="py-2 px-4 border border-gray-300 text-right">{(item.amount).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end">
            <div className="w-48">
              <div className="flex justify-between border-b border-gray-300 py-1">
                <span className="font-semibold">Total :</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-b border-gray-300 py-1">
                <span className="font-semibold">Total TTC :</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-b border-gray-300 py-1">
                <span className="font-semibold">Déjà réglé :</span>
                <span>{parseFloat(montantRegle).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1 font-bold">
                <span>NET à payer :</span>
                <span>{netAPayer.toFixed(2)} €</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center text-sm text-gray-600">
            <p>Micro-entreprise {fournisseur.name} - {fournisseur.address}, {fournisseur.city}</p>
            <p>TVA non applicable, article 293 B du CGI</p>
            <p>Page 1/1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactureGenerator;