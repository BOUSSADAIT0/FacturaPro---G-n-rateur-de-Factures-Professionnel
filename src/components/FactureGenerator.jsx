import React, { useState, useRef, useEffect } from 'react';
import { Printer, Download } from 'lucide-react';

const FactureGenerator = () => {
  // État pour stocker les informations de la facture
  const [factureNumber, setFactureNumber] = useState('');
  const [errors, setErrors] = useState([]);
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

  // Fonction pour générer le numéro de facture basé sur la date avec UUID
  const generateFactureNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Générer un UUID court pour l'unicité
    const uuid = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Générer le numéro de facture : AAAA + MM + JJ + UUID
    const factureNum = `${year}${month}${day}-${uuid}`;
    
    return factureNum;
  };

  // Fonction pour valider tous les champs
  const validateFields = () => {
    const newErrors = [];

    // Validation Fournisseur
    if (!fournisseur.name.trim()) newErrors.push("Le nom de l'entreprise fournisseur est obligatoire");
    if (!fournisseur.address.trim()) newErrors.push("L'adresse du fournisseur est obligatoire");
    if (!fournisseur.city.trim()) newErrors.push("La ville du fournisseur est obligatoire");
    if (!fournisseur.siret.trim()) newErrors.push("Le SIRET du fournisseur est obligatoire");
    if (!fournisseur.autoEntrepreneurName.trim()) newErrors.push("Le nom de l'auto-entrepreneur est obligatoire");
    if (!fournisseur.iban.trim()) newErrors.push("L'IBAN est obligatoire");

    // Validation Client
    if (!client.name.trim()) newErrors.push("Le nom du client est obligatoire");
    if (!client.address.trim()) newErrors.push("L'adresse du client est obligatoire");
    if (!client.city.trim()) newErrors.push("La ville du client est obligatoire");
    if (!client.siret.trim()) newErrors.push("Le SIRET du client est obligatoire");

    // Validation Date d'échéance
    if (!dateEcheance) newErrors.push("La date d'échéance est obligatoire");

    // Validation Articles
    const hasValidItems = items.some(item => 
      item.description.trim() && item.quantity > 0 && item.price > 0
    );
    if (!hasValidItems) newErrors.push("Au moins un article avec description, quantité et prix est obligatoire");

    // Validation spécifique des articles
    items.forEach((item, index) => {
      if (item.description.trim() && (item.quantity <= 0 || item.price <= 0)) {
        newErrors.push(`Article ${index + 1}: Quantité et prix doivent être supérieurs à 0`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
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

  // Fonction pour gérer l'impression
  const handlePrint = () => {
    if (!validateFields()) {
      return; // Arrêter si validation échoue
    }
    
    // Générer le numéro de facture APRÈS validation
    const newFactureNumber = generateFactureNumber();
    setFactureNumber(newFactureNumber);
    
    // Attendre que le state se mette à jour puis imprimer
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Fonction pour générer et télécharger le PDF
  const generatePDF = () => {
    if (!validateFields()) {
      return; // Arrêter si validation échoue
    }
    
    // Générer le numéro de facture APRÈS validation
    const newFactureNumber = generateFactureNumber();
    setFactureNumber(newFactureNumber);
    
    // Attendre que le state se mette à jour puis générer le PDF
    setTimeout(() => {
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
    }, 100);
  };

  // Calculer le montant net à payer
  const netAPayer = total - montantRegle;

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      {/* Bannière d'information importante */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              ⚠️ Information importante sur la confidentialité
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                <strong>🔒 Vos données sont confidentielles :</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Aucune donnée n'est stockée sur nos serveurs</li>
                <li>Vos informations restent uniquement dans votre navigateur</li>
                <li>Nous n'utilisons pas vos données à des fins commerciales</li>
              </ul>
              <p className="mt-2 font-semibold text-red-600">
                ⚡ IMPORTANT : Générez ou imprimez votre facture avant de quitter la page, 
                sinon vos données seront perdues !
              </p>
              <p className="mb-2">
              <strong>👨‍💻 Développeur :</strong> AIT DJOUDI OUFELLA Boussad — accompagné par un guide en Intelligence Artificielle

              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white shadow-md mb-4">
        <h1 className="text-2xl font-bold mb-4">Générateur de Factures</h1>
        
        {/* Affichage des erreurs */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-bold mb-2">Erreurs de validation :</h3>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
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
            onClick={handlePrint}
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
              <p>Numéro de facture : {factureNumber || 'Non généré'}</p>
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