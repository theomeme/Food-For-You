import React, { useState, useEffect } from "react";
import SidebarPage from "../components/SidebarPage";
import RecipeCard from "../components/RecipeCard";
import api from "../services/api";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../context/authContext";
import { Modal, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import {
  AiOutlineClockCircle,
  AiOutlineClose,
  AiOutlineCloseCircle,
} from "react-icons/ai";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { RecipeProps } from "../interfaces/RecipeProps";
import Swal from "sweetalert2";
import { useIngredients } from "../context/ingredientsContext";
import Dropdown from "../components/Dropdown";

interface CalculatedValues {
  [key: string]: any;
}

interface SelectedIngredientsProps {
  name: string;
  id: string;
}

const nutritionalValueTranslation: { [key: string]: string } = {
  'Calcium_mg': 'Cálcio mg',
  'Carb_g': 'Carboidratos g',
  'Copper_mcg': 'Cobre mcg',
  'Energy_kcal': 'Energia kcal',
  'Fat_g': 'Gordura g',
  'Fiber_g': 'Fibra g',
  'Folate_mcg': 'Folato mcg',
  'Iron_mg': 'Ferro mg',
  'Magnesium_mg': 'Magnésio mg',
  'Manganese_mg': 'Manganês mg',
  'Niacin_mg': 'Niacina mg',
  'Phosphorus_mg': 'Fósforo mg',
  'Potassium_mg': 'Potássio mg',
  'Protein_g': 'Proteína g',
  'Riboflavin_mg': 'Riboflavina mg',
  'Selenium_mcg': 'Selênio mcg',
  'Sodium_mg': 'Sódio mg',
  'Sugar_g': 'Açúcar g',
  'Thiamin_mg': 'Tiamina mg',
  'VitA_mcg': 'Vitamina A mcg',
  'VitB12_mcg': 'Vitamina B12 mcg',
  'VitB6_mg': 'Vitamina B6 mg',
  'VitC_mg': 'Vitamina C mg',
  'VitD2_mcg': 'Vitamina D2 mcg',
  'VitE_mg': 'Vitamina E mg',
  'Zinc_mg': 'Zinco mg',
};

const MyRecipes: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [ingredientSearchText] = useState("");
  const [visible] = useState(false);
  const [recipes, setRecipes] = useState<RecipeProps[]>([]);
  const [newRecipeName, setNewRecipeName] = useState("");
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [ingredientGrams, setIngredientGrams] = useState<{ [key: string]: string }>({});
  const [newPreparationStep, setNewPreparationStep] = useState("");
  const [preparationMethodList, setPreparationMethodList] = useState<string[]>([]);
  const [newPreparationTime, setNewPreparationTime] = useState(0);
  const [showError, setShowError] = useState(false);
  const { getToken } = useAuth();
  const { handleSetIngredients } = useIngredients();
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredientsProps[]>([]);
  const [nutritionalValues, setNutritionalValues] = useState<CalculatedValues>({});

  useEffect(() => {
    fetchRecipes();
    fetchIngredients(ingredientSearchText);
  }, []);

  useEffect(() => {
    fetchIngredients(ingredientSearchText);
  }, [ingredientSearchText]);

  const fetchRecipes = async () => {
    try {
      const token = await getToken();
      const response = await api.get("/api/v1/user/recipe", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setRecipes(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchIngredients = async (query = "") => {
    try {
      const token = await getToken();
      const response = await api.get(`/api/v1/user/ingredient?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        handleSetIngredients(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  const submitAddedRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRecipe() || Object.keys(nutritionalValues).length === 0) {
      setShowError(true);
      return;
    }
    Swal.fire({
      title: "Loading",
      html: "Loading",
      timer: 2000,
      timerProgressBar: true,
    });

    try {
      const token = await getToken();
      const formData = getFormData();

      const response = await api.post("/api/v1/user/recipe", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.close();

      if (response.data) {
        closeModal();
        clearRecipeFields();
        setNutritionalValues({});
        fetchRecipes();
        Swal.fire({
          title: "Success!",
          text: "Recipe added successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error sending data:", error);
      closeModal();
      Swal.close();
      Swal.fire({
        title: "Error!",
        text: "An error occurred while adding the recipe.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDeleteIngredient = (index: number) => {
    const ingredientToDelete = ingredientsList[index];
    setIngredientsList(ingredientsList.filter((_, i) => i !== index));
    const { [ingredientToDelete]: _, ...rest } = ingredientGrams;
    setIngredientGrams(rest);
  };

  const handleGramsChange = (ingredient: string, value: string) => {
    setIngredientGrams({ ...ingredientGrams, [ingredient]: value });
  };

  const handleDeletePreparationStep = (index: number) => {
    setPreparationMethodList((prevList) => {
      const newList = [...prevList];
      newList.splice(index, 1);
      return newList;
    });
  };

  const closeModal = () => {
    clearRecipeFields();
    setNutritionalValues({});
    setOpenModal(false);
  };

  const addPreparationStepToList = () => {
    if (newPreparationStep.trim() !== "") {
      setPreparationMethodList([...preparationMethodList, newPreparationStep]);
      setNewPreparationStep("");
    }
  };

  const resetRecipeItemsInputs = () => {
    setIngredientsList([]);
    setPreparationMethodList([]);
    setNewPreparationStep("");
    setShowError(false);
    setNutritionalValues({});
  };

  const clearRecipeFields = () => {
    setNewRecipeName("");
    setNewPreparationTime(0);
    setIngredientsList([]);
    setPreparationMethodList([]);
    setNutritionalValues({});
  };

  const getFormData = (): {} => {
    return {
      name: newRecipeName,
      ingredients: ingredientsList.map((ingredient) => ({
        name: ingredient,
        quantity: ingredientGrams[ingredient],
      })),
      preparationMethod: preparationMethodList,
      preparationTime: newPreparationTime,
      nutritionalValues: nutritionalValues,
    };
  };

  const validateRecipe = () => {
    return (
      newRecipeName.trim() !== "" &&
      ingredientsList.length > 0 &&
      preparationMethodList.length > 0 &&
      newPreparationTime > 0
    );
  };

  const handleAddSelectedIngredient = (name: string, id: string) => {
    const isAlreadyAdded = selectedIngredients.some((item) => item.id === id);
    if (!isAlreadyAdded) {
      const newItem: SelectedIngredientsProps = { name, id };
      setSelectedIngredients((prev) => [...prev, newItem]);

      if (!ingredientsList.includes(name)) {
        setIngredientsList((prev) => [...prev, name]);
        setIngredientGrams((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  const handleSendIngredients = async () => {
    try {
      const ingredientsToSend = selectedIngredients.map((ingredient) => ({
        _id: ingredient.id,
        Descrip: ingredient.name,
        quantity: parseInt(ingredientGrams[ingredient.name] || "0", 10),
      }));

      const response = await fetch('http://127.0.0.1:5000/process_ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredientsToSend),
      });

      const data: CalculatedValues = await response.json();
      setNutritionalValues(data.nutritional_values);
    } catch (error) {
      console.error('Error sending ingredients:', error);
    }
  };

  return (
    <>
      <Modal
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        open={openModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div className="w-[70vw] h-[75vh] bg-white rounded-[4px] py-[40px] px-[40px] overflow-auto">
          <div className="flex justify-between items-center mb-[40px]">
            <h1 className="text-md text-title font-bold">
              Adicionar nova receita
            </h1>
            <AiOutlineClose
              size={25}
              className="cursor-pointer text-title"
              onClick={closeModal}
            />
          </div>
          <form onSubmit={submitAddedRecipe}>
            <div className="mb-4">
              <label className="block text-title text-md font-semibold mb-2">
                Nome da Receita
              </label>
              <input
                type="text"
                value={newRecipeName}
                onChange={(e) => setNewRecipeName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Nome da Receita"
              />
            </div>
            <div className="flex flex-col mb-4 relative">
              <label className="block text-title text-md font-semibold mb-2">
                Ingredientes
              </label>
              <div className="relative z-10">
                <Dropdown onClick={handleAddSelectedIngredient} />
              </div>
            </div>
            <div className="ml-5 mb-6">
              {ingredientsList.map((ingredient, index) => (
                <div key={index} className="flex items-center mb-2">
                  <div className="w-2/5">
                    <span>
                      {index + 1}. {ingredient}
                    </span>
                  </div>
                  <div className="flex-grow flex justify-start items-center pl-4">
                    <input
                      type="number"
                      value={ingredientGrams[ingredient] || ""}
                      onChange={(e) => handleGramsChange(ingredient, e.target.value)}
                      className="w-[100px] text-left"
                      placeholder="Gramas"
                    />
                    <button
                      className="ml-2 text-red-500"
                      type="button"
                      onClick={() => handleDeleteIngredient(index)}
                    >
                      <AiOutlineCloseCircle />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSendIngredients}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Calcular Valores Nutricionais
            </button>
            {Object.keys(nutritionalValues).length > 0 && (
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table stickyHeader aria-label="nutritional values table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nutrientes</TableCell>
                      <TableCell align="right">Valor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(nutritionalValues).map(([key, value], index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {nutritionalValueTranslation[key] || key}
                        </TableCell>
                        <TableCell align="right">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <h2 className="text-md text-title font-semibold mb-2">
              Passos de preparo
            </h2>
            <div className="mb-4 flex">
              <input
                type="text"
                value={newPreparationStep}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPreparationStepToList();
                  }
                }}
                onChange={(e) => setNewPreparationStep(e.target.value)}
                className="shadow appearance-none border rounded w-4/5 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Novo Passo de Preparo"
              />
              <Button
                type="button"
                disabled={newPreparationStep.trim() === ""}
                title="Adicionar"
                width="w-1/5"
                onClick={addPreparationStepToList}
              />
            </div>
            <ul className="ml-5 list-decimal">
              {preparationMethodList.map((step, index) => (
                <li className="flex items-center mb-2" key={index}>
                  {index + 1}. {step}
                  <button
                    className="ml-2 text-red-500"
                    type="button"
                    onClick={() => handleDeletePreparationStep(index)}
                  >
                    <AiOutlineCloseCircle />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Tempo de Preparo (minutos)
              </label>
              <Input
                type="number"
                required
                value={newPreparationTime}
                onChange={(e) => setNewPreparationTime(Number(e.target.value))}
                placeholder="Tempo"
                firstIcon={<AiOutlineClockCircle color="#667085" size={20} />}
              />
            </div>
            {showError && (
              <div className="text-red-600 mb-4">
                Por favor, preencha todos os campos.
              </div>
            )}
            <div className="flex justify-end items-end mt-[30px] mb-[10px]">
              <Button type="submit" title="Salvar" />
            </div>
          </form>
        </div>
      </Modal>
      <SidebarPage headerTitle="Minhas Receitas">
        <div className="flex flex-col w-full">
          <div className="h-[80vh] flex flex-col w-full pr-[100px] mt-[40px]">
            <Input
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder="Buscar..."
              firstIcon={<IoSearchOutline color="#667085" size={20} />}
              icon={
                <button onClick={() => setFilterText("")}>
                  <IoIosCloseCircleOutline color="#667085" size={20} />
                </button>
              }
            />
            <div className="flex justify-between items-center mt-[40px]">
              <h1 className="text-md text-subtitle self-end">Sua lista</h1>
              {visible && (
                <Button
                  title="Deletar"
                  width="w-[120px]"
                  marginBottom=""
                  backgroundColor="bg-remove"
                  onClick={() => {}}
                />
              )}
              <Button
                title="Adicionar"
                width="w-[120px]"
                marginBottom=""
                marginLeft="ml-[40px]"
                onClick={() => {
                  resetRecipeItemsInputs();
                  setOpenModal(true);
                }}
              />
            </div>
            <div className="w-full h-[100%] mt-[20px] overflow-y-scroll">
              {recipes.map((recipe: RecipeProps) => (
                <RecipeCard
                  key={recipe.id}
                  recipeProps={recipe}
                  fetchRecipes={fetchRecipes}
                />
              ))}
            </div>
          </div>
        </div>
      </SidebarPage>
    </>
  );
};

export default MyRecipes;