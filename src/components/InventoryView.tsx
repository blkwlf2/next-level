import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { InventoryForm } from "./InventoryForm";
import { AllocationForm } from "./AllocationForm";

export function InventoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [allocationItem, setAllocationItem] = useState<any>(null);

  const inventory = useQuery(api.inventory.list, {
    search: searchTerm || undefined,
    category: categoryFilter || undefined,
    status: statusFilter as any || undefined,
  });

  const categories = useQuery(api.inventory.categories, {});

  const handleAllocate = (item: any) => {
    setAllocationItem(item);
    setShowAllocationForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Track and manage your inventory items</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Items
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Filter
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory?.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.status === 'available' ? 'bg-green-100 text-green-800' :
                  item.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'out-of-stock' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status.replace('-', ' ')}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {item.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium">{item.availableQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{item.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="font-medium">${item.unitPrice.toFixed(2)}</span>
                </div>
                {item.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{item.location}</span>
                  </div>
                )}
              </div>
              
              {/* Stock Level Indicator */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Stock Level</span>
                  <span>{item.quantity}/{item.minQuantity} min</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.quantity <= item.minQuantity ? 'bg-red-500' :
                      item.quantity <= item.minQuantity * 2 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (item.quantity / (item.minQuantity * 3)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleAllocate(item)}
                    className="text-green-600 hover:text-green-800 text-sm"
                    disabled={item.availableQuantity === 0}
                  >
                    Allocate
                  </button>
                </div>
                {item.allocatedQuantity > 0 && (
                  <span className="text-xs text-orange-600">
                    {item.allocatedQuantity} allocated
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {inventory?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No inventory items found. Add your first item to get started.</p>
        </div>
      )}

      {showForm && (
        <InventoryForm onClose={() => setShowForm(false)} />
      )}

      {selectedItem && (
        <InventoryForm
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {showAllocationForm && allocationItem && (
        <AllocationForm
          item={allocationItem}
          onClose={() => {
            setShowAllocationForm(false);
            setAllocationItem(null);
          }}
        />
      )}
    </div>
  );
}
