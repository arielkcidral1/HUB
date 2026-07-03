import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ajuste o caminho conforme necessário

export default function MalotesUpdate() {
  const [malotes, setMalotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    destino: '',
    epis: '',
    status: '',
    observacoes: '',
    updated_by: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Carregar os registros de malotes
  useEffect(() => {
    fetchMalotes();
  }, []);

  const fetchMalotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hub_malotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMalotes(data || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar malotes:', err);
      setError(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (malote) => {
    setEditingId(malote.id);
    setFormData({
      destino: malote.destino,
      epis: malote.epis,
      status: malote.status,
      observacoes: malote.observacoes,
      updated_by: malote.updated_by || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      destino: '',
      epis: '',
      status: '',
      observacoes: '',
      updated_by: ''
    });
  };

  const handleSave = async (maloteId) => {
    try {
      setLoading(true);
      setError(null);

      // Validação básica
      if (!formData.destino.trim()) {
        setError('Destino é obrigatório');
        setLoading(false);
        return;
      }

      if (!formData.updated_by.trim()) {
        setError('Nome do colaborador é obrigatório');
        setLoading(false);
        return;
      }

      // Atualizar o registro
      const { data, error } = await supabase
        .from('hub_malotes')
        .update({
          destino: formData.destino,
          epis: formData.epis,
          status: formData.status,
          observacoes: formData.observacoes,
          updated_by: formData.updated_by
        })
        .eq('id', maloteId)
        .select();

      if (error) {
        throw error;
      }

      setSuccess('Registro atualizado com sucesso!');
      setEditingId(null);
      
      // Recarregar os dados
      await fetchMalotes();

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar malote:', err);
      setError(`Erro ao atualizar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gerenciar Malotes</h1>

      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tabela de malotes */}
      {loading && !editingId ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Destino</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Atualizado por</th>
                <th className="border p-2 text-left">Observações</th>
                <th className="border p-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {malotes.map((malote) => (
                <tr key={malote.id} className="hover:bg-gray-50">
                  {editingId === malote.id ? (
                    // Modo edição
                    <>
                      <td className="border p-2">{malote.id}</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="destino"
                          value={formData.destino}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                          placeholder="Destino"
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Selecionar Status</option>
                          <option value="Separação">Separação</option>
                          <option value="Verificado">Verificado</option>
                          <option value="Entregue">Entregue</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="updated_by"
                          value={formData.updated_by}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded bg-yellow-50"
                          placeholder="Nome do colaborador"
                          required
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          name="observacoes"
                          value={formData.observacoes}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded"
                          placeholder="Observações (ex: Nome do colaborador que recebe)"
                        />
                      </td>
                      <td className="border p-2 text-center">
                        <button
                          onClick={() => handleSave(malote.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={loading}
                          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    // Modo visualização
                    <>
                      <td className="border p-2">{malote.id}</td>
                      <td className="border p-2">{malote.destino}</td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-white text-sm ${
                          malote.status === 'Entregue' ? 'bg-green-500' :
                          malote.status === 'Verificado' ? 'bg-blue-500' :
                          malote.status === 'Separação' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {malote.status}
                        </span>
                      </td>
                      <td className="border p-2 font-semibold text-blue-600">{malote.updated_by || '-'}</td>
                      <td className="border p-2 text-sm text-gray-600">{malote.observacoes || '-'}</td>
                      <td className="border p-2 text-center">
                        <button
                          onClick={() => handleEdit(malote)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Editar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {malotes.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Nenhum registro de malote encontrado.
        </div>
      )}
    </div>
  );
}
