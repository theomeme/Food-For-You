import React, { useState, useEffect } from "react";
import SidebarPage from "../components/SidebarPage";
import RecipeCard from "../components/RecipeCard";
import api from "../services/api";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../context/authContext";
import { Modal } from "@mui/material";
import { AiOutlineClockCircle, AiOutlineClose, AiOutlineCloseCircle } from "react-icons/ai";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { RecipeProps } from "../interfaces/RecipeProps";
import Swal from "sweetalert2";
import FlatList from "flatlist-react";

interface Ingredient {
  _id: string;
  Descrip: string;
}

const MyRecipes: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [ingredientSearchText, setIngredientSearchText] = useState("");
  const [visible, setVisible] = useState(false);
  const [recipes, setRecipes] = useState<RecipeProps[]>([]);
  const [newRecipeName, setNewRecipeName] = useState("");
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
  const [ingredientGrams, setIngredientGrams] = useState<{ [key: string]: string }>({});
  const [newPreparationStep, setNewPreparationStep] = useState("");
  const [preparationMethodList, setPreparationMethodList] = useState<string[]>([]);
  const [newPreparationTime, setNewPreparationTime] = useState(0);
  const [showError, setShowError] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (openModal) {
      fetchAllIngredients();
    }
  }, [openModal]);

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

  const fetchAllIngredients = async () => {
    try {
      const token = await getToken();
      const response = await api.get("/api/v1/ingredients", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setAllIngredients(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  const submitAddedRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRecipe()) {
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
      console.log(formData);

      const response = await api.post("/api/v1/user/recipe", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.close();

      if (response.data) {
        closeModal();
        clearRecipeFields();
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
    const { [ingredientToDelete.Descrip]: _, ...rest } = ingredientGrams;
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
    setOpenModal(false);
  };

  const addIngredientToList = (ingredient: Ingredient) => {
    if (ingredientsList.some((ing) => ing._id === ingredient._id)) return;
    setIngredientsList([...ingredientsList, ingredient]);
    setIngredientGrams({ ...ingredientGrams, [ingredient.Descrip]: '' });
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
  };

  const clearRecipeFields = () => {
    setNewRecipeName("");
    setNewPreparationTime(0);
    setIngredientsList([]);
    setPreparationMethodList([]);
  };

  const getFormData = (): {} => {
    return {
      name: newRecipeName,
      ingredients: ingredientsList.map((ingredient) => ({
        name: ingredient.Descrip,
        quantity: ingredientGrams[ingredient.Descrip],
      })),
      preparationMethod: preparationMethodList,
      preparationTime: newPreparationTime,
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

  const filteredIngredients = allIngredients.filter((ingredient) =>
    ingredient.Descrip.toLowerCase().includes(ingredientSearchText.toLowerCase())
  );

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
        <div className="min-w-[50vw] min-h-[50vh] bg-white rounded-[4px] py-[20px] px-[40px]">
          <div className="flex justify-between items-center mb-[40px]">
            <h1 className="text-md text-title font-bold ">
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
            <h2 className="text-md text-title font-semibold mb-2">
              Ingredientes
            </h2>
            <div className="mb-4 flex">
              <Input
                value={ingredientSearchText}
                onChange={(e) => setIngredientSearchText(e.target.value)}
                placeholder="Buscar Ingrediente"
                firstIcon={<IoSearchOutline color="#667085" size={20} />}
                icon={
                  <button onClick={() => setIngredientSearchText("")}>
                    <IoIosCloseCircleOutline color="#667085" size={20} />
                  </button>
                }
              />
            </div>
            <div className="mb-4 h-[150px] overflow-y-scroll border p-2 rounded">
              <FlatList
                list={filteredIngredients}
                renderItem={(ingredient, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-200 p-2 rounded"
                    onClick={() => addIngredientToList(ingredient)}
                  >
                    <span>{ingredient.Descrip}</span>
                  </div>
                )}
                renderWhenEmpty={() => <div className="text-center">Nenhum ingrediente encontrado</div>}
              />
            </div>
            <ul className="ml-5 list-disc mb-4">
              {ingredientsList.map((ingredient, index) => (
                <li key={index} className="flex items-center">
                  {index + 1}. {ingredient.Descrip}
                  <input
                    type="number"
                    value={ingredientGrams[ingredient.Descrip] || ""}
                    onChange={(e) => handleGramsChange(ingredient.Descrip, e.target.value)}
                    className="ml-2 border rounded w-20 px-2 py-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Gramas"
                  />
                  <button
                    className="ml-2 text-red-500"
                    type="button"
                    onClick={() => handleDeleteIngredient(index)}
                  >
                    <AiOutlineCloseCircle />
                  </button>
                </li>
              ))}
            </ul>
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
            <ul className="ml-5 list-decimal mb-4">
              {preparationMethodList.map((step, index) => (
                <li className="flex items-center" key={index}>
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
              <Button
                type="submit"
                title="Salvar"
              />
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